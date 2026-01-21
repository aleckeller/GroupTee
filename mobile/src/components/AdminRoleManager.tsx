import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useInvitations } from "@/hooks/useInvitations";
import { useRoster } from "@/hooks/useGroupMembers";
import { UserRole, RosterMember } from "../types";

export default function AdminRoleManager() {
  const { userProfile } = useAuth();
  const { selectedGroup } = useGroup();

  // Use the unified roster hook
  const {
    roster,
    loading: rosterLoading,
    refetch: refetchRoster,
  } = useRoster(selectedGroup?.id || null);

  // Invitation functionality
  const {
    createInvitation,
    deleteInvitation,
    sendInviteEmail,
    updateInvitationEmail,
  } = useInvitations();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPendingOptionsModal, setShowPendingOptionsModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [selectedPendingMember, setSelectedPendingMember] = useState<RosterMember | null>(null);
  const [newInviteName, setNewInviteName] = useState("");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateUserRole = async (membershipId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", membershipId);

      if (error) {
        Alert.alert("Error", `Failed to update role: ${error.message}`);
        return;
      }

      Alert.alert("Success", "Role updated");
      refetchRoster();
    } catch (error) {
      Alert.alert("Error", "Failed to update user role");
    }
  };

  const showRoleOptions = (member: RosterMember) => {
    if (member.id === userProfile?.id) {
      Alert.alert("Warning", "You cannot change your own role");
      return;
    }

    if (!member.membership_id) {
      return;
    }

    const roles: UserRole[] = ["admin", "member", "guest"];
    const availableRoles = roles.filter((r) => r !== member.role);

    const emailText = member.email ? `\nEmail: ${member.email}` : "";

    Alert.alert(
      "Change Role",
      `${member.display_name || "this user"}${emailText}\n\nSelect a new role:`,
      [
        ...availableRoles.map((role) => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: () => updateUserRole(member.membership_id!, role),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  // Unified invite handler
  const handleInvite = async () => {
    if (!newInviteName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (!selectedGroup?.id) {
      Alert.alert("Error", "No group selected");
      return;
    }

    setSubmitting(true);

    const result = await createInvitation(
      "group_member",
      selectedGroup.id,
      newInviteName.trim(),
      newInviteEmail.trim() || undefined,
      "member"
    );

    if (result.error) {
      setSubmitting(false);
      Alert.alert("Error", result.error);
      return;
    }

    // If email provided, send the invite email
    if (newInviteEmail.trim() && result.code) {
      const emailResult = await sendInviteEmail({
        email: newInviteEmail.trim(),
        inviteCode: result.code,
        groupName: selectedGroup.name,
        inviterName: userProfile?.full_name || "Admin",
        displayName: newInviteName.trim(),
      });

      setSubmitting(false);
      setShowInviteModal(false);
      setNewInviteName("");
      setNewInviteEmail("");
      refetchRoster();

      if (emailResult.success) {
        Alert.alert(
          "Invite Sent",
          `An invitation email has been sent to ${newInviteEmail.trim()}.\n\nInvite code: ${result.code}`
        );
      } else {
        Alert.alert(
          "Invite Created",
          `Email could not be sent, but the invite was created.\n\nInvite code: ${result.code}\n\nShare this code with ${newInviteName.trim()}.`
        );
      }
    } else {
      setSubmitting(false);
      setShowInviteModal(false);
      setNewInviteName("");
      setNewInviteEmail("");
      refetchRoster();

      Alert.alert(
        "Invite Created",
        `Invite code: ${result.code}\n\nShare this code with ${newInviteName.trim()} to join the group.`
      );
    }
  };

  // Pending member handlers
  const handleRemovePendingMember = (member: RosterMember) => {
    if (!member.invitation_id) return;

    Alert.alert(
      "Remove Invitation",
      `Remove "${member.display_name}" from the roster?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const result = await deleteInvitation(member.invitation_id!);
            if (result.error) {
              Alert.alert("Error", result.error);
            } else {
              refetchRoster();
            }
          },
        },
      ]
    );
  };

  const handleCopyInviteCode = async (member: RosterMember) => {
    if (!member.invite_code) return;
    await Clipboard.setStringAsync(member.invite_code);
    Alert.alert("Copied", `Invite code "${member.invite_code}" copied to clipboard`);
  };

  const showPendingMemberOptions = (member: RosterMember) => {
    setSelectedPendingMember(member);
    setShowPendingOptionsModal(true);
  };

  const handleOpenEditEmail = (member: RosterMember) => {
    setEditEmail(member.email || "");
    setShowPendingOptionsModal(false);
    setShowEditEmailModal(true);
  };

  const handleUpdateEmailAndSend = async () => {
    if (!selectedPendingMember?.invitation_id || !editEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (!selectedGroup) {
      Alert.alert("Error", "No group selected");
      return;
    }

    setSubmitting(true);

    // Update the email in the database
    const updateResult = await updateInvitationEmail(
      selectedPendingMember.invitation_id,
      editEmail.trim()
    );

    if (!updateResult.success) {
      setSubmitting(false);
      Alert.alert("Error", updateResult.error || "Failed to update email");
      return;
    }

    // Send the invite email
    if (selectedPendingMember.invite_code) {
      const emailResult = await sendInviteEmail({
        email: editEmail.trim(),
        inviteCode: selectedPendingMember.invite_code,
        groupName: selectedGroup.name,
        inviterName: userProfile?.full_name || "Admin",
        displayName: selectedPendingMember.display_name,
      });

      setSubmitting(false);
      setShowEditEmailModal(false);
      setEditEmail("");
      refetchRoster();

      if (emailResult.success) {
        Alert.alert(
          "Email Sent",
          `An invitation email has been sent to ${editEmail.trim()}.`
        );
      } else {
        Alert.alert(
          "Email Updated",
          `Email was saved but the invite email could not be sent.\n\nYou can try again or share the invite code manually: ${selectedPendingMember.invite_code}`
        );
      }
    } else {
      setSubmitting(false);
      setShowEditEmailModal(false);
      setEditEmail("");
      refetchRoster();
      Alert.alert("Email Updated", "Email address has been saved.");
    }
  };

  const isAdmin = userProfile?.role === "admin";

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "admin":
        return { bg: "#fef2f2", text: "#dc2626" };
      case "member":
        return { bg: "#f0fdf4", text: "#059669" };
      case "guest":
        return { bg: "#fef3c7", text: "#d97706" };
      default:
        return { bg: "#f1f5f9", text: "#64748b" };
    }
  };

  const renderRosterMember = ({ item }: { item: RosterMember }) => {
    const badgeStyle = getRoleBadgeStyle(item.role);
    const isCurrentUser = !item.is_pending && item.id === userProfile?.id;

    const handlePress = () => {
      if (!isAdmin) return;
      if (item.is_pending) {
        showPendingMemberOptions(item);
      } else {
        showRoleOptions(item);
      }
    };

    return (
      <Pressable
        style={[styles.userCard, item.is_pending && styles.pendingCard]}
        onPress={isAdmin ? handlePress : undefined}
        disabled={!isAdmin || isCurrentUser}
      >
        <View style={styles.userRow}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.display_name}
              {isCurrentUser && <Text style={styles.youLabel}> (you)</Text>}
            </Text>
            {item.is_pending && isAdmin && (
              <Text style={styles.pendingLabel}>
                Pending signup {item.invite_code && `• Code: ${item.invite_code}`}
              </Text>
            )}
          </View>
          <View style={styles.badgeContainer}>
            {item.is_pending && isAdmin && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
            <View style={[styles.roleBadge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.roleText, { color: badgeStyle.text }]}>
                {item.role}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (rosterLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  // Calculate roster filtering values early (before any early returns that use them)
  const pendingCount = roster.filter((m) => m.is_pending).length;
  const baseRoster = isAdmin ? roster : roster.filter((m) => !m.is_pending);
  const filteredRoster = searchQuery.trim()
    ? baseRoster.filter((m) =>
        m.display_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : baseRoster;

  if (!selectedGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please select a group first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAdmin && (
        <Pressable
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Text style={styles.inviteButtonText}>+ Invite</Text>
        </Pressable>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <Text style={styles.sectionLabel}>
        {filteredRoster.length} {filteredRoster.length === 1 ? "person" : "people"} in roster
        {isAdmin && pendingCount > 0 && (
          <Text style={styles.pendingCount}>
            {" "}({pendingCount} pending)
          </Text>
        )}
      </Text>

      <FlatList
        data={filteredRoster}
        keyExtractor={(item) => `${item.is_pending ? "pending" : "member"}-${item.id}`}
        renderItem={renderRosterMember}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? "No members match your search" : "No members yet"}
          </Text>
        }
      />

      {isAdmin && (
        <Text style={styles.hint}>Tap a member to change their role or manage pending invites</Text>
      )}

        {/* Invite Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInviteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Invite to Group</Text>
              <Text style={styles.modalSubtitle}>
                The person will appear as pending until they sign up with the invite code
              </Text>

              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={newInviteName}
                onChangeText={setNewInviteName}
                autoFocus
              />

              <Text style={styles.inputLabel}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email to send invite"
                value={newInviteEmail}
                onChangeText={setNewInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>
                If provided, an invite email will be sent automatically
              </Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowInviteModal(false);
                    setNewInviteName("");
                    setNewInviteEmail("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleInvite}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Invite</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Pending Member Options Modal */}
        <Modal
          visible={showPendingOptionsModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowPendingOptionsModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPendingOptionsModal(false)}
          >
            <View style={styles.optionsModal}>
              <Text style={styles.optionsTitle}>
                {selectedPendingMember?.display_name}
              </Text>
              {selectedPendingMember?.invite_code && (
                <Text style={styles.optionsSubtitle}>
                  Invite code: {selectedPendingMember.invite_code}
                </Text>
              )}
              {selectedPendingMember?.email && (
                <Text style={styles.optionsEmailLabel}>
                  Email: {selectedPendingMember.email}
                </Text>
              )}

              <Pressable
                style={styles.optionButton}
                onPress={() => {
                  if (selectedPendingMember) {
                    handleOpenEditEmail(selectedPendingMember);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>
                  {selectedPendingMember?.email ? "Update Email & Resend Invite" : "Add Email & Send Invite"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.optionButton}
                onPress={() => {
                  if (selectedPendingMember) {
                    handleCopyInviteCode(selectedPendingMember);
                    setShowPendingOptionsModal(false);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>Copy Invite Code</Text>
              </Pressable>

              <Pressable
                style={[styles.optionButton, styles.optionButtonDanger]}
                onPress={() => {
                  if (selectedPendingMember) {
                    setShowPendingOptionsModal(false);
                    handleRemovePendingMember(selectedPendingMember);
                  }
                }}
              >
                <Text style={styles.optionButtonTextDanger}>Remove Invitation</Text>
              </Pressable>

              <Pressable
                style={styles.optionButtonCancel}
                onPress={() => setShowPendingOptionsModal(false)}
              >
                <Text style={styles.optionButtonCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Edit Email Modal */}
        <Modal
          visible={showEditEmailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditEmailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedPendingMember?.email ? "Update Email" : "Add Email"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedPendingMember?.email
                  ? `Update email for ${selectedPendingMember?.display_name} and resend the invitation`
                  : `Add an email for ${selectedPendingMember?.display_name} to send them an invitation`}
              </Text>

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowEditEmailModal(false);
                    setEditEmail("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleUpdateEmailAndSend}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {selectedPendingMember?.email ? "Update & Send" : "Add & Send"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  inviteButton: {
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  inviteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingCount: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  pendingCard: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  youLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#94a3b8",
  },
  pendingLabel: {
    fontSize: 12,
    color: "#d97706",
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  loadingText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    paddingBottom: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: -12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Options modal styles
  optionsModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  optionsSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  optionsEmailLabel: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    marginTop: -8,
  },
  optionButton: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  optionButtonDanger: {
    backgroundColor: "#fef2f2",
  },
  optionButtonTextDanger: {
    fontSize: 16,
    fontWeight: "500",
    color: "#dc2626",
  },
  optionButtonCancel: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  optionButtonCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
  },
});
