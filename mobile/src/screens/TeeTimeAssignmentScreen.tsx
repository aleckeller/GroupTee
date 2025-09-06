import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { useGroupMembers, GroupMember } from "@/hooks/useGroupMembers";
import { useGroup } from "@/hooks/useGroup";
import { formatDate, formatTime } from "@/utils/formatting";
import { TeeTime, Player } from "@/utils/teeTimeUtils";
import RoleGuard from "@/components/RoleGuard";

type RouteParams = {
  teeTime: TeeTime;
};

export default function TeeTimeAssignmentScreen() {
  const route = useRoute();
  const { selectedGroup } = useGroup();
  const { teeTime } = route.params as RouteParams;
  const { members, loading: membersLoading } = useGroupMembers(
    selectedGroup?.id || null
  );

  const [assignedPlayers, setAssignedPlayers] = useState<Player[]>(
    teeTime.players || []
  );
  const [loading, setLoading] = useState(false);
  const [aiAssigning, setAiAssigning] = useState(false);

  const isFull = assignedPlayers.length >= teeTime.max_players;

  const handleAssignPlayer = async (member: GroupMember) => {
    if (isFull) {
      Alert.alert(
        "Tee Time Full",
        "This tee time is already at maximum capacity."
      );
      return;
    }

    if (assignedPlayers.some((player) => player.id === member.id)) {
      Alert.alert(
        "Already Assigned",
        "This member is already assigned to this tee time."
      );
      return;
    }

    Alert.alert(
      "Assign Player",
      `Are you sure you want to assign ${
        member.full_name || "this player"
      } to this tee time?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Assign", onPress: () => assignPlayer(member) },
      ]
    );
  };

  const assignPlayer = async (member: GroupMember) => {
    try {
      setLoading(true);

      // Add the player to the tee time
      const { error } = await supabase.from("assignments").insert({
        tee_time_id: teeTime.id,
        user_id: member.id,
        weekend_id: teeTime.weekend_id,
      });

      if (error) {
        console.error("Error assigning player:", error);
        Alert.alert("Error", "Failed to assign player to tee time.");
        return;
      }

      // Update local state
      const newPlayer: Player = {
        id: member.id,
        full_name: member.full_name || "Unknown",
      };
      setAssignedPlayers([...assignedPlayers, newPlayer]);

      Alert.alert(
        "Success",
        `${member.full_name || "Player"} has been assigned to this tee time.`
      );
    } catch (error) {
      console.error("Error in assignPlayer:", error);
      Alert.alert("Error", "Failed to assign player to tee time.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    Alert.alert(
      "Remove Player",
      `Are you sure you want to remove ${player.full_name} from this tee time?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => removePlayer(player) },
      ]
    );
  };

  const removePlayer = async (player: Player) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("tee_time_id", teeTime.id)
        .eq("user_id", player.id);

      if (error) {
        console.error("Error removing player:", error);
        Alert.alert("Error", "Failed to remove player from tee time.");
        return;
      }

      // Update local state
      setAssignedPlayers(assignedPlayers.filter((p) => p.id !== player.id));

      Alert.alert(
        "Success",
        `${player.full_name} has been removed from this tee time.`
      );
    } catch (error) {
      console.error("Error in removePlayer:", error);
      Alert.alert("Error", "Failed to remove player from tee time.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMembers = () => {
    return members.filter(
      (member) => !assignedPlayers.some((player) => player.id === member.id)
    );
  };

  const handleAiAutoAssign = async () => {
    if (isFull) {
      Alert.alert(
        "Tee Time Full",
        "This tee time is already at maximum capacity."
      );
      return;
    }

    const availableMembers = getAvailableMembers();
    if (availableMembers.length === 0) {
      Alert.alert(
        "No Available Members",
        "There are no available members to auto-assign."
      );
      return;
    }

    Alert.alert(
      "AI Auto-Assignment",
      `AI will automatically assign players to this tee time based on their preferences. This will assign up to ${Math.min(
        availableMembers.length,
        teeTime.max_players - assignedPlayers.length
      )} players.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Auto-Assign", onPress: () => performAiAutoAssign() },
      ]
    );
  };

  const performAiAutoAssign = async () => {
    try {
      setAiAssigning(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock AI assignment logic - randomly select available members
      const availableMembers = getAvailableMembers();
      const maxToAssign = Math.min(
        availableMembers.length,
        teeTime.max_players - assignedPlayers.length
      );

      // Randomly select members to assign (simulating AI preference-based selection)
      const shuffledMembers = [...availableMembers].sort(
        () => Math.random() - 0.5
      );
      const selectedMembers = shuffledMembers.slice(0, maxToAssign);

      // Create mock assignments
      const newPlayers: Player[] = selectedMembers.map((member) => ({
        id: member.id,
        full_name: member.full_name || "Unknown",
      }));

      // Simulate database operations by adding to assignments table
      for (const member of selectedMembers) {
        const { error } = await supabase.from("assignments").insert({
          tee_time_id: teeTime.id,
          user_id: member.id,
          weekend_id: teeTime.weekend_id,
        });

        if (error) {
          console.error("Error assigning player:", error);
          throw new Error(`Failed to assign ${member.full_name}`);
        }
      }

      // Update local state
      setAssignedPlayers([...assignedPlayers, ...newPlayers]);

      Alert.alert(
        "Auto-Assignment Complete",
        `Successfully assigned ${newPlayers.length} players to this tee time.`
      );
    } catch (error) {
      console.error("Error in AI auto-assignment:", error);
      Alert.alert(
        "Auto-Assignment Failed",
        "Failed to auto-assign players. Please try again or assign manually."
      );
    } finally {
      setAiAssigning(false);
    }
  };

  if (membersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading group members...</Text>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Assign Players</Text>
          <Text style={styles.teeTimeInfo}>
            {formatDate(teeTime.tee_date)} at {formatTime(teeTime.tee_time)}
          </Text>
          <Text style={styles.capacityInfo}>
            {assignedPlayers.length} / {teeTime.max_players} players assigned
          </Text>

          {/* AI Auto-Assignment Button */}
          {!isFull && getAvailableMembers().length > 0 && (
            <Pressable
              style={[styles.aiButton, aiAssigning && styles.aiButtonDisabled]}
              onPress={handleAiAutoAssign}
              disabled={aiAssigning || loading}
            >
              {aiAssigning ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.aiButtonIcon}>🤖</Text>
              )}
              <Text
                style={[
                  styles.aiButtonText,
                  aiAssigning && { color: "#6366f1" },
                ]}
              >
                {aiAssigning ? "Assigning..." : "Smart Assign"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Assigned Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Players</Text>
          {assignedPlayers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No players assigned yet</Text>
            </View>
          ) : (
            <View style={styles.playersList}>
              {assignedPlayers.map((player) => (
                <View key={player.id} style={styles.assignedPlayerCard}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerIcon}>👤</Text>
                    <Text style={styles.playerName}>{player.full_name}</Text>
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemovePlayer(player)}
                    disabled={loading}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Available Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Members {isFull && "(Tee Time Full)"}
          </Text>
          {getAvailableMembers().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isFull ? "Tee time is full" : "No available members to assign"}
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {getAvailableMembers().map((member) => (
                <Pressable
                  key={member.id}
                  style={[
                    styles.memberCard,
                    isFull && styles.memberCardDisabled,
                  ]}
                  onPress={() => handleAssignPlayer(member)}
                  disabled={isFull || loading}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberIcon}>👤</Text>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>
                        {member.full_name || "Unknown"}
                      </Text>
                      <View
                        style={[
                          styles.roleBadge,
                          member.role === "admin"
                            ? styles.roleAdmin
                            : member.role === "member"
                            ? styles.roleMember
                            : styles.roleGuest,
                        ]}
                      >
                        <Text style={styles.roleText}>{member.role}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.assignButtonText}>Assign</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  teeTimeInfo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  capacityInfo: {
    fontSize: 14,
    color: "#64748b",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
  playersList: {
    gap: 8,
  },
  assignedPlayerCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },
  removeButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  membersList: {
    gap: 8,
  },
  memberCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberCardDisabled: {
    backgroundColor: "#f8f9fa",
    opacity: 0.6,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: "#fef2f2",
  },
  roleMember: {
    backgroundColor: "#f0fdf4",
  },
  roleGuest: {
    backgroundColor: "#fef3c7",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  assignButtonText: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "600",
  },
  aiButton: {
    backgroundColor: "#fef7ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
    overflow: "hidden",
  },
  aiButtonDisabled: {
    backgroundColor: "#f3e8ff",
    borderColor: "#d8b4fe",
    opacity: 0.6,
  },
  aiButtonIcon: {
    fontSize: 16,
    color: "#6366f1",
  },
  aiButtonText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
