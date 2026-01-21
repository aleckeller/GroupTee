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
import { useAuth } from "@/hooks/useAuth";
import {
  AdminStackParamList,
  Group,
  GroupMember,
  UserRole,
} from "@/types";

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;
type RouteProps = RouteProp<AdminStackParamList, "GroupDetail">;

export default function GroupDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const { userProfile } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, club_id")
        .eq("id", groupId)
        .single();

      if (error) {
        console.error("Error fetching group:", error);
        return;
      }

      setGroup(data);
      setEditName(data.name);
    } catch (error) {
      console.error("Error in fetchGroup:", error);
    }
  }, [groupId]);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, role, user_id, profiles:user_id(id, full_name)")
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching members:", error);
        return;
      }

      const membersList: GroupMember[] = (data || []).map((m: any) => ({
        id: m.profiles.id,
        full_name: m.profiles.full_name,
        role: m.role as UserRole,
        membership_id: m.id,
      }));

      setMembers(membersList);
    } catch (error) {
      console.error("Error in fetchMembers:", error);
    }
  }, [groupId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGroup(), fetchMembers()]);
    setLoading(false);
  }, [fetchGroup, fetchMembers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveGroup = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("groups")
      .update({ name: editName.trim() })
      .eq("id", groupId);
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setShowEditModal(false);
      fetchGroup();
    }
  };

  const handleChangeRole = async (newRole: UserRole) => {
    if (!selectedMember) return;

    const { error } = await supabase
      .from("memberships")
      .update({ role: newRole })
      .eq("id", selectedMember.membership_id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setShowRoleModal(false);
      setSelectedMember(null);
      fetchMembers();
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (member.id === userProfile?.id) {
      Alert.alert("Error", "You cannot remove yourself from the group");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Remove ${member.full_name || "this member"} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("memberships")
              .delete()
              .eq("id", member.membership_id);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              fetchMembers();
            }
          },
        },
      ]
    );
  };

  const openRoleModal = (member: GroupMember) => {
    if (member.id === userProfile?.id) {
      Alert.alert("Error", "You cannot change your own role");
      return;
    }
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "admin":
        return styles.roleBadgeAdmin;
      case "member":
        return styles.roleBadgeMember;
      default:
        return styles.roleBadgeGuest;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emptyText}>Group not found</Text>
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
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <Pressable
            style={styles.addButton}
            onPress={() =>
              navigation.navigate("InviteUser", {
                groupId,
                type: "group_member",
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add Member</Text>
          </Pressable>
        </View>

        {members.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No members yet.</Text>
          </View>
        ) : (
          members.map((member) => (
            <View key={member.membership_id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.full_name || "Unknown User"}
                </Text>
                <Pressable
                  style={[styles.roleBadge, getRoleBadgeStyle(member.role)]}
                  onPress={() => openRoleModal(member)}
                >
                  <Text style={styles.roleBadgeText}>{member.role}</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Group Modal */}
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
            <Text style={styles.modalTitle}>Edit Group</Text>
            <Pressable onPress={handleSaveGroup} disabled={saving}>
              <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter group name"
            />
          </View>
        </View>
      </Modal>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.roleModalOverlay}>
          <View style={styles.roleModalContent}>
            <Text style={styles.roleModalTitle}>
              Change role for {selectedMember?.full_name}
            </Text>
            {(["admin", "member", "guest"] as UserRole[]).map((role) => (
              <Pressable
                key={role}
                style={[
                  styles.roleOption,
                  selectedMember?.role === role && styles.roleOptionSelected,
                ]}
                onPress={() => handleChangeRole(role)}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedMember?.role === role && styles.roleOptionTextSelected,
                  ]}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.roleModalCancel}
              onPress={() => {
                setShowRoleModal(false);
                setSelectedMember(null);
              }}
            >
              <Text style={styles.roleModalCancelText}>Cancel</Text>
            </Pressable>
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
  groupHeader: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
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
  memberCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    color: "#1e293b",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: "#dbeafe",
  },
  roleBadgeMember: {
    backgroundColor: "#dcfce7",
  },
  roleBadgeGuest: {
    backgroundColor: "#f3f4f6",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
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
  roleModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  roleModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  roleOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  roleOptionSelected: {
    backgroundColor: "#0ea5e9",
  },
  roleOptionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#334155",
  },
  roleOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  roleModalCancel: {
    padding: 16,
    marginTop: 8,
  },
  roleModalCancelText: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
  },
});
