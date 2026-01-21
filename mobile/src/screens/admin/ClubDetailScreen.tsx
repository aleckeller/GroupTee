import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@/lib/supabase";
import { useClubs } from "@/hooks/useClubs";
import { useClubGroups } from "@/hooks/useClubGroups";
import { useSystemRole } from "@/hooks/useSystemRole";
import { AdminStackParamList, Club, Group, UserProfile } from "@/types";

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;
type RouteProps = RouteProp<AdminStackParamList, "ClubDetail">;

type ClubAdminWithProfile = {
  id: string;
  user_id: string;
  club_id: string;
  profiles: UserProfile;
};

export default function ClubDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { clubId } = route.params;
  const { isSysadmin } = useSystemRole();
  const { clubs, updateClub } = useClubs();
  const { groups, loading: groupsLoading, createGroup, deleteGroup, refresh: refreshGroups } = useClubGroups(clubId);

  const [club, setClub] = useState<Club | null>(null);
  const [clubAdmins, setClubAdmins] = useState<ClubAdminWithProfile[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Find the club from the clubs list
  useEffect(() => {
    const foundClub = clubs.find((c) => c.id === clubId);
    if (foundClub) {
      setClub(foundClub);
      setEditName(foundClub.name);
      setEditWebsite(foundClub.website_url || "");
    }
  }, [clubs, clubId]);

  const fetchClubAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const { data, error } = await supabase
        .from("club_admins")
        .select("id, user_id, club_id, profiles:user_id(id, full_name)")
        .eq("club_id", clubId);

      if (error) {
        console.error("Error fetching club admins:", error);
        return;
      }

      setClubAdmins(data as unknown as ClubAdminWithProfile[]);
    } catch (error) {
      console.error("Error in fetchClubAdmins:", error);
    } finally {
      setAdminsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClubAdmins();
  }, [fetchClubAdmins]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGroups(), fetchClubAdmins()]);
    setRefreshing(false);
  };

  const handleSaveClub = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Club name is required");
      return;
    }

    setSaving(true);
    const result = await updateClub(clubId, {
      name: editName.trim(),
      website_url: editWebsite.trim() || null,
    });
    setSaving(false);

    if (result.error) {
      Alert.alert("Error", result.error);
    } else {
      setShowEditModal(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    setCreatingGroup(true);
    const result = await createGroup(newGroupName.trim());
    setCreatingGroup(false);

    if (result.error) {
      Alert.alert("Error", result.error);
    } else {
      setShowCreateGroupModal(false);
      setNewGroupName("");
    }
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This will remove all members from this group.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteGroup(group.id);
            if (result.error) {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const handleRemoveClubAdmin = async (admin: ClubAdminWithProfile) => {
    Alert.alert(
      "Remove Club Admin",
      `Remove ${admin.profiles.full_name || "this user"} as a club admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("club_admins")
              .delete()
              .eq("id", admin.id);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              fetchClubAdmins();
            }
          },
        },
      ]
    );
  };

  if (!club) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading club...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.clubHeader}>
          <View style={styles.clubHeaderInfo}>
            <Text style={styles.clubName}>{club.name}</Text>
            {club.website_url && (
              <Text style={styles.clubWebsite}>{club.website_url}</Text>
            )}
          </View>
          {isSysadmin && (
            <Pressable
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}
        </View>

        {/* Club Admins Section */}
        {isSysadmin && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Club Admins</Text>
              <Pressable
                style={styles.addButton}
                onPress={() =>
                  navigation.navigate("InviteUser", {
                    clubId,
                    type: "club_admin",
                  })
                }
              >
                <Text style={styles.addButtonText}>+ Invite</Text>
              </Pressable>
            </View>

            {adminsLoading ? (
              <View style={styles.card}>
                <Text style={styles.loadingText}>Loading admins...</Text>
              </View>
            ) : clubAdmins.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>No club admins yet.</Text>
              </View>
            ) : (
              clubAdmins.map((admin) => (
                <View key={admin.id} style={styles.adminCard}>
                  <Text style={styles.adminName}>
                    {admin.profiles.full_name || "Unknown User"}
                  </Text>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveClubAdmin(admin)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}

        {/* Groups Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Groups</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowCreateGroupModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Group</Text>
          </Pressable>
        </View>

        {groupsLoading ? (
          <View style={styles.card}>
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No groups yet. Create one to get started.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <Pressable
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate("GroupDetail", { groupId: group.id })}
            >
              <Text style={styles.groupName}>{group.name}</Text>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteGroup(group)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Edit Club Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Club</Text>
            <Pressable onPress={handleSaveClub} disabled={saving}>
              <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Club Name *</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter club name"
            />

            <Text style={styles.inputLabel}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={editWebsite}
              onChangeText={setEditWebsite}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreateGroupModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Group</Text>
            <Pressable onPress={handleCreateGroup} disabled={creatingGroup}>
              <Text style={[styles.saveText, creatingGroup && styles.saveTextDisabled]}>
                {creatingGroup ? "Creating..." : "Create"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  clubHeader: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  clubHeaderInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  clubWebsite: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#0ea5e9",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
  },
  addButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    color: "#64748b",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  adminCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  adminName: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#fee2e2",
  },
  removeButtonText: {
    color: "#dc2626",
    fontSize: 14,
  },
  groupCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  groupName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  cancelText: {
    color: "#64748b",
    fontSize: 16,
  },
  saveText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#94a3b8",
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
