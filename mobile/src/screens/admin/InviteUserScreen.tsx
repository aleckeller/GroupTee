import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Share,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { useInvitations } from "@/hooks/useInvitations";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { AdminStackParamList, RootStackParamList, UserRole, UserProfile } from "@/types";

type AdminRouteProps = RouteProp<AdminStackParamList, "InviteUser">;
type RootRouteProps = RouteProp<RootStackParamList, "InviteUser">;

export default function InviteUserScreen() {
  const route = useRoute<AdminRouteProps | RootRouteProps>();
  const { groupId, type } = route.params;
  const clubId = "clubId" in route.params ? route.params.clubId : undefined;

  const { userProfile } = useAuth();
  const { selectedGroup } = useGroup();
  const { createInvitation, sendInviteEmail, invitations } = useInvitations();
  const {
    users,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    loadMore,
    refresh,
  } = useAvailableUsers(groupId);

  const [activeTab, setActiveTab] = useState<"list" | "code">("list");
  const [selectedRole, setSelectedRole] = useState<UserRole>("member");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const isClubAdminInvite = type === "club_admin";
  const targetId = isClubAdminInvite ? clubId! : groupId!;

  const handleAddUser = async (user: UserProfile) => {
    setAddingUserId(user.id);

    try {
      if (isClubAdminInvite) {
        const { error } = await supabase.from("club_admins").insert([
          {
            user_id: user.id,
            club_id: clubId,
          },
        ]);

        if (error) {
          if (error.code === "23505") {
            Alert.alert("Info", "This user is already a club admin");
          } else {
            Alert.alert("Error", error.message);
          }
        } else {
          Alert.alert("Success", `${user.full_name || "User"} added as club admin`);
          refresh();
        }
      } else {
        const { error } = await supabase.from("memberships").insert([
          {
            user_id: user.id,
            group_id: groupId,
            role: selectedRole,
          },
        ]);

        if (error) {
          if (error.code === "23505") {
            Alert.alert("Info", "This user is already a member of the group");
          } else {
            Alert.alert("Error", error.message);
          }
        } else {
          Alert.alert("Success", `${user.full_name || "User"} added as ${selectedRole}`);
          refresh();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add user");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    const result = await createInvitation(type, targetId, selectedRole);
    setGenerating(false);

    if (result.error) {
      Alert.alert("Error", result.error);
    } else if (result.code) {
      setGeneratedCode(result.code);
      setGeneratedExpiresAt(result.expiresAt || null);
      setInviteEmail("");
    }
  };

  const handleSendEmail = async () => {
    if (!generatedCode || !inviteEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    Keyboard.dismiss();
    setSendingEmail(true);

    const groupName = selectedGroup?.name || "your group";
    const inviterName = userProfile?.full_name || "";

    const result = await sendInviteEmail({
      email: inviteEmail.trim(),
      inviteCode: generatedCode,
      groupName,
      inviterName,
      expiresAt: generatedExpiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    setSendingEmail(false);

    if (result.success) {
      Alert.alert("Success", `Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
    } else {
      Alert.alert("Error", result.error || "Failed to send email");
    }
  };

  const handleShareCode = async () => {
    if (generatedCode) {
      try {
        await Share.share({
          message: `Join using this invite code: ${generatedCode}`,
        });
      } catch (error) {
        Alert.alert("Code", generatedCode);
      }
    }
  };

  const pendingInvitations = invitations.filter((inv) =>
    isClubAdminInvite ? inv.club_id === clubId : inv.group_id === groupId
  );

  const renderUser = useCallback(
    ({ item }: { item: UserProfile }) => {
      const isAdding = addingUserId === item.id;
      return (
        <Pressable
          style={styles.userCard}
          onPress={() => handleAddUser(item)}
          disabled={isAdding}
        >
          <Text style={styles.userName}>{item.full_name || "Unknown User"}</Text>
          {isAdding ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <Text style={styles.addText}>Add</Text>
          )}
        </Pressable>
      );
    },
    [addingUserId, selectedRole]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0ea5e9" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? "No users found matching your search" : "No available users to add"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "list" && styles.tabActive]}
          onPress={() => setActiveTab("list")}
        >
          <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>
            Add Users
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "code" && styles.tabActive]}
          onPress={() => setActiveTab("code")}
        >
          <Text style={[styles.tabText, activeTab === "code" && styles.tabTextActive]}>
            Invite Code
          </Text>
        </Pressable>
      </View>

      {activeTab === "list" ? (
        <View style={styles.listContainer}>
          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name..."
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Role Selector */}
          {!isClubAdminInvite && (
            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Role:</Text>
              {(["member", "admin", "guest"] as UserRole[]).map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleChip, selectedRole === role && styles.roleChipSelected]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === role && styles.roleChipTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* User List */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={users.length === 0 ? styles.emptyList : undefined}
            />
          )}
        </View>
      ) : (
        <View style={styles.codeContainer}>
          <Text style={styles.sectionDescription}>
            Generate an invite code for users who haven't signed up yet. Codes are valid for 7 days.
          </Text>

          {!isClubAdminInvite && (
            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Role:</Text>
              {(["member", "admin", "guest"] as UserRole[]).map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleChip, selectedRole === role && styles.roleChipSelected]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === role && styles.roleChipTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {generatedCode ? (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <Text style={styles.code}>{generatedCode}</Text>
              <Pressable style={styles.shareButton} onPress={handleShareCode}>
                <Text style={styles.shareButtonText}>Share Code</Text>
              </Pressable>

              <View style={styles.emailSection}>
                <Text style={styles.emailLabel}>Or send via email</Text>
                <TextInput
                  style={styles.emailInput}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!sendingEmail}
                />
                <Pressable
                  style={[
                    styles.sendEmailButton,
                    (!inviteEmail.trim() || sendingEmail) && styles.sendEmailButtonDisabled,
                  ]}
                  onPress={handleSendEmail}
                  disabled={!inviteEmail.trim() || sendingEmail}
                >
                  <Text style={styles.sendEmailButtonText}>
                    {sendingEmail ? "Sending..." : "Send Invite Email"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.generateAnotherButton}
                onPress={() => {
                  setGeneratedCode(null);
                  setGeneratedExpiresAt(null);
                  setInviteEmail("");
                }}
              >
                <Text style={styles.generateAnotherText}>Generate Another Code</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.generateButton}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              <Text style={styles.generateButtonText}>
                {generating ? "Generating..." : "Generate Invite Code"}
              </Text>
            </Pressable>
          )}

          {pendingInvitations.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingTitle}>Pending Invitations</Text>
              {pendingInvitations.map((inv) => (
                <View key={inv.id} style={styles.pendingCard}>
                  <Text style={styles.pendingCode}>{inv.code}</Text>
                  <Text style={styles.pendingExpiry}>
                    Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    margin: 16,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#1e293b",
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  roleSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginRight: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleChipSelected: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  roleChipText: {
    fontSize: 14,
    color: "#64748b",
  },
  roleChipTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },
  userCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
  },
  addText: {
    color: "#0ea5e9",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  codeContainer: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  codeCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 4,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emailSection: {
    width: "100%",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  emailLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 12,
  },
  emailInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  sendEmailButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  sendEmailButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  sendEmailButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  generateAnotherButton: {
    padding: 8,
    marginTop: 16,
  },
  generateAnotherText: {
    color: "#64748b",
    fontSize: 14,
  },
  pendingSection: {
    marginTop: 24,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 2,
  },
  pendingExpiry: {
    fontSize: 12,
    color: "#64748b",
  },
});
