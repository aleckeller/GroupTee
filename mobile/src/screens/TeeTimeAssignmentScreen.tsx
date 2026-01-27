import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroup } from "@/hooks/useGroup";
import { useInvitations } from "@/hooks/useInvitations";
import {
  useInterestsForDate,
  InterestWithProfile,
} from "@/hooks/useInterestsForDate";
import { formatDate, formatTime } from "@/utils/formatting";
import { setHasAssignmentChanges } from "@/utils/navigationState";
import { GroupMember, TeeTime, Player, Invitation } from "../types";
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
  const { getGroupInvitations } = useInvitations();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const { interests, loading: interestsLoading } = useInterestsForDate(
    teeTime.tee_date,
    selectedGroup?.id || null
  );

  // Extended player type to support pending members (invitations)
  type AssignedPlayer = Player & {
    is_pending?: boolean;
    invitation_id?: string;
  };

  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>(
    (teeTime.players || []).map((p: any) => ({
      ...p,
      is_pending: p.is_pending || false,
      invitation_id: p.is_pending ? p.id : undefined,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [aiAssigning, setAiAssigning] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [guestNames, setGuestNames] = useState<{ [key: string]: string[] }>({});
  const [editingGuest, setEditingGuest] = useState<{
    player: Player;
    guestNumber: number;
  } | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Load pending invitations
  useEffect(() => {
    const loadPendingInvitations = async () => {
      if (!selectedGroup?.id) {
        setPendingLoading(false);
        return;
      }
      setPendingLoading(true);
      const invitations = await getGroupInvitations(selectedGroup.id);
      setPendingInvitations(invitations);
      setPendingLoading(false);
    };
    loadPendingInvitations();
  }, [selectedGroup?.id, getGroupInvitations]);

  // Load existing guest names when component mounts
  useEffect(() => {
    const loadGuestNames = async () => {
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("user_id, invitation_id, guest_names")
          .eq("tee_time_id", teeTime.id);

        if (error) {
          console.error("Error loading assignments:", error);
          return;
        }

        const guestNamesMap: { [key: string]: string[] } = {};

        data?.forEach((assignment: { user_id: string | null; invitation_id: string | null; guest_names: string[] | null }) => {
          if (assignment.guest_names && assignment.guest_names.length > 0) {
            const playerId = assignment.user_id || assignment.invitation_id;
            if (playerId) {
              guestNamesMap[playerId] = assignment.guest_names;
            }
          }
        });

        setGuestNames(guestNamesMap);
      } catch (error) {
        console.error("Error loading guest names:", error);
      }
    };

    loadGuestNames();
  }, [teeTime.id]);

  // Calculate total spots needed including guests
  const getTotalSpotsNeeded = (member: GroupMember) => {
    const memberInterest = getMemberInterest(member.id);
    return 1 + (memberInterest?.guest_count || 0); // 1 for member + guest count
  };

  const getCurrentTotalSpots = () => {
    return assignedPlayers.reduce((total, player) => {
      const playerGuestCount = (guestNames[player.id] || []).length;
      return total + 1 + playerGuestCount;
    }, 0);
  };

  const isFull = getCurrentTotalSpots() >= teeTime.max_players;

  const handleAssignPlayer = async (member: GroupMember) => {
    const memberInterest = getMemberInterest(member.id);
    const spotsNeeded = getTotalSpotsNeeded(member);
    const currentSpots = getCurrentTotalSpots();
    const availableSpots = teeTime.max_players - currentSpots;

    if (spotsNeeded > availableSpots) {
      Alert.alert(
        "Not Enough Space",
        `This member needs ${spotsNeeded} spot${
          spotsNeeded > 1 ? "s" : ""
        } (including ${memberInterest?.guest_count || 0} guest${
          (memberInterest?.guest_count || 0) > 1 ? "s" : ""
        }), but only ${availableSpots} spot${availableSpots > 1 ? "s" : ""} ${
          availableSpots === 1 ? "is" : "are"
        } available.`
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

    const guestText =
      (memberInterest?.guest_count || 0) > 0
        ? ` and ${memberInterest?.guest_count || 0} guest${
            (memberInterest?.guest_count || 0) > 1 ? "s" : ""
          }`
        : "";

    Alert.alert(
      "Assign Player",
      `Are you sure you want to assign ${
        member.full_name || "this player"
      }${guestText} to this tee time?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Assign", onPress: () => assignPlayer(member) },
      ]
    );
  };

  const assignPlayer = async (member: GroupMember) => {
    try {
      setLoading(true);

      // Build default guest names from interest data
      const memberInterest = getMemberInterest(member.id);
      const guestCount = memberInterest?.guest_count || 0;
      const defaultGuestNames = Array.from(
        { length: guestCount },
        (_, i) => `${member.full_name}'s Guest ${i + 1}`
      );

      // Add the player to the tee time
      const { error } = await supabase.from("assignments").insert({
        tee_time_id: teeTime.id,
        user_id: member.id,
        weekend_id: teeTime.weekend_id,
        ...(guestCount > 0 && { guest_names: defaultGuestNames }),
      });

      if (error) {
        console.error("Error assigning player:", error);
        // Check if this is a capacity constraint error
        if (error.message && error.message.includes("Not enough space")) {
          Alert.alert("Not Enough Space", error.message);
        } else {
          Alert.alert("Error", "Failed to assign player to tee time.");
        }
        return;
      }

      // Update local state
      const newPlayer: AssignedPlayer = {
        id: member.id,
        full_name: member.full_name || "Unknown",
        is_pending: false,
        guest_names: defaultGuestNames,
      };
      setAssignedPlayers([...assignedPlayers, newPlayer]);

      // Update guest names map for display
      if (guestCount > 0) {
        setGuestNames((prev) => ({
          ...prev,
          [member.id]: defaultGuestNames,
        }));
      }

      // Mark that there were assignment changes
      setHasAssignmentChanges(true);

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

  // Handle assigning a pending member (invitation)
  const handleAssignPendingMember = async (invitation: Invitation) => {
    const currentSpots = getCurrentTotalSpots();
    const availableSpots = teeTime.max_players - currentSpots;

    if (availableSpots < 1) {
      Alert.alert(
        "Not Enough Space",
        "This tee time is full. No spots available."
      );
      return;
    }

    if (assignedPlayers.some((player) => player.id === invitation.id)) {
      Alert.alert(
        "Already Assigned",
        "This member is already assigned to this tee time."
      );
      return;
    }

    Alert.alert(
      "Assign Pending Member",
      `Are you sure you want to assign ${invitation.display_name || "this person"} to this tee time?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Assign", onPress: () => assignPendingMember(invitation) },
      ]
    );
  };

  const assignPendingMember = async (invitation: Invitation) => {
    try {
      setLoading(true);

      // Add the pending member (invitation) to the tee time
      const { error } = await supabase.from("assignments").insert({
        tee_time_id: teeTime.id,
        invitation_id: invitation.id,
        weekend_id: teeTime.weekend_id,
      });

      if (error) {
        console.error("Error assigning pending member:", error);
        Alert.alert("Error", "Failed to assign pending member to tee time.");
        return;
      }

      // Update local state
      const newPlayer: AssignedPlayer = {
        id: invitation.id,
        full_name: invitation.display_name || "Unnamed",
        is_pending: true,
        invitation_id: invitation.id,
      };
      setAssignedPlayers([...assignedPlayers, newPlayer]);

      // Mark that there were assignment changes
      setHasAssignmentChanges(true);

      Alert.alert(
        "Success",
        `${invitation.display_name || "Pending member"} has been assigned to this tee time.`
      );
    } catch (error) {
      console.error("Error in assignPendingMember:", error);
      Alert.alert("Error", "Failed to assign pending member to tee time.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (player: AssignedPlayer) => {
    const playerGuestCount = (guestNames[player.id] || []).length;

    const guestText =
      playerGuestCount > 0
        ? ` and their ${playerGuestCount} guest${playerGuestCount > 1 ? "s" : ""}`
        : "";

    Alert.alert(
      "Remove Player",
      `Are you sure you want to remove ${player.full_name}${guestText} from this tee time?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => removePlayer(player) },
      ]
    );
  };

  const removePlayer = async (player: AssignedPlayer) => {
    try {
      setLoading(true);

      let deleteQuery = supabase
        .from("assignments")
        .delete()
        .eq("tee_time_id", teeTime.id);

      // Use the appropriate column based on whether it's a pending member
      if (player.is_pending && player.invitation_id) {
        deleteQuery = deleteQuery.eq("invitation_id", player.invitation_id);
      } else {
        deleteQuery = deleteQuery.eq("user_id", player.id);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error("Error removing player:", error);
        Alert.alert("Error", "Failed to remove player from tee time.");
        return;
      }

      // Update local state
      const removedGuestCount = (guestNames[player.id] || []).length;
      setAssignedPlayers(assignedPlayers.filter((p) => p.id !== player.id));
      setGuestNames((prev) => {
        const next = { ...prev };
        delete next[player.id];
        return next;
      });

      // Mark that there were assignment changes
      setHasAssignmentChanges(true);

      const guestText =
        removedGuestCount > 0
          ? ` and their ${removedGuestCount} guest${removedGuestCount > 1 ? "s" : ""}`
          : "";

      Alert.alert(
        "Success",
        `${player.full_name}${guestText} has been removed from this tee time.`
      );
    } catch (error) {
      console.error("Error in removePlayer:", error);
      Alert.alert("Error", "Failed to remove player from tee time.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGuestName = (player: Player, guestNumber: number) => {
    const currentGuestNames = guestNames[player.id] || [];
    const currentName =
      currentGuestNames[guestNumber - 1] ||
      `${player.full_name}'s Guest ${guestNumber}`;
    setEditingGuest({ player, guestNumber });
    setGuestNameInput(currentName);
  };

  const saveGuestName = async () => {
    if (!editingGuest) return;

    try {
      setLoading(true);
      const { player, guestNumber } = editingGuest;
      const currentGuestNames = guestNames[player.id] || [];
      const newGuestNames = [...currentGuestNames];
      newGuestNames[guestNumber - 1] = guestNameInput;

      // Update the assignment with guest names
      const { error } = await supabase
        .from("assignments")
        .update({ guest_names: newGuestNames })
        .eq("tee_time_id", teeTime.id)
        .eq("user_id", player.id);

      if (error) {
        console.error("Error updating guest names:", error);
        Alert.alert("Error", "Failed to update guest name.");
        return;
      }

      // Update local state
      setGuestNames((prev) => ({
        ...prev,
        [player.id]: newGuestNames,
      }));

      setEditingGuest(null);
      setGuestNameInput("");
    } catch (error) {
      console.error("Error saving guest name:", error);
      Alert.alert("Error", "Failed to save guest name.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMembers = () => {
    if (showAllMembers) {
      // Show all members when toggle is on
      return members.filter(
        (member) => !assignedPlayers.some((player) => player.id === member.id)
      );
    } else {
      // Show only members who have submitted interest for this date
      const interestedMemberIds = new Set(
        interests.map((interest) => interest.user_id)
      );

      return members.filter(
        (member) =>
          interestedMemberIds.has(member.id) &&
          !assignedPlayers.some((player) => player.id === member.id)
      );
    }
  };

  const getMemberInterest = (
    memberId: string
  ): InterestWithProfile | undefined => {
    return interests.find((interest) => interest.user_id === memberId);
  };

  // Get primary preferences to show on main card (time + guests)
  const getPrimaryPreferences = (
    memberInterest: InterestWithProfile | undefined
  ) => {
    if (!memberInterest) return [];

    const preferences = [];

    // Always show time preference if available
    if (memberInterest.time_preference) {
      preferences.push({
        type: "time",
        value: memberInterest.time_preference,
        icon: "🕐",
        label: memberInterest.time_preference,
      });
    }

    // Always show guests if available
    if ((memberInterest.guest_count || 0) > 0) {
      preferences.push({
        type: "guests",
        count: memberInterest.guest_count || 0,
        icon: "👥",
        label: `+${memberInterest.guest_count || 0} guest${
          (memberInterest.guest_count || 0) > 1 ? "s" : ""
        }`,
      });
    }

    return preferences;
  };

  // Get secondary preferences (transportation, partners, notes) for expanded view
  const getSecondaryPreferences = (
    memberInterest: InterestWithProfile | undefined,
    allMembers: GroupMember[] = []
  ) => {
    if (!memberInterest) return [];

    const preferences = [];

    if (memberInterest.transportation) {
      preferences.push({
        type: "transportation",
        value: memberInterest.transportation,
        icon: memberInterest.transportation === "walking" ? "🚶" : "🏌️",
        label:
          memberInterest.transportation === "walking" ? "Walking" : "Riding",
      });
    }

    // Parse and display preferred partners
    if (memberInterest.partners) {
      try {
        // Handle different formats of partners data
        let partnersArray;

        if (typeof memberInterest.partners === "string") {
          // Try to parse as JSON first
          try {
            partnersArray = JSON.parse(memberInterest.partners);
          } catch (jsonError) {
            // If JSON parsing fails, try to split by comma (legacy format)
            console.log(
              "JSON parse failed, trying comma split for partners:",
              memberInterest.partners
            );
            partnersArray = memberInterest.partners
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);
          }
        } else if (Array.isArray(memberInterest.partners)) {
          // Already an array
          partnersArray = memberInterest.partners;
        } else {
          console.log(
            "Unexpected partners format:",
            typeof memberInterest.partners,
            memberInterest.partners
          );
          return preferences;
        }

        if (Array.isArray(partnersArray) && partnersArray.length > 0) {
          // Get partner names from member IDs
          const partnerNames = partnersArray
            .map((partnerId) => {
              const partner = allMembers.find(
                (member) => member.id === partnerId
              );
              return partner ? partner.full_name : null;
            })
            .filter(Boolean);

          if (partnerNames.length > 0) {
            preferences.push({
              type: "partners",
              value: partnersArray, // Store the original member IDs
              icon: "👥",
              label: `Preferred Partners: ${partnerNames.join(", ")}`,
            });
          }
        }
      } catch (error) {
        console.error(
          "Error parsing partners:",
          error,
          "Raw partners data:",
          memberInterest.partners
        );
      }
    }

    if (memberInterest.notes) {
      preferences.push({
        type: "notes",
        value: memberInterest.notes,
        icon: "📝",
        label:
          memberInterest.notes.length > 20
            ? memberInterest.notes.substring(0, 20) + "..."
            : memberInterest.notes,
      });
    }

    return preferences;
  };

  // Toggle card expansion
  const toggleCardExpansion = (memberId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const getInterestedMembers = () => {
    // Always return only interested members for AI assignment
    const interestedMemberIds = new Set(
      interests.map((interest) => interest.user_id)
    );

    return members.filter(
      (member) =>
        interestedMemberIds.has(member.id) &&
        !assignedPlayers.some((player) => player.id === member.id)
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

    const interestedMembers = getInterestedMembers();
    if (interestedMembers.length === 0) {
      Alert.alert(
        "No Interested Members",
        "There are no interested members to auto-assign for this date."
      );
      return;
    }

    const availableSpots = teeTime.max_players - getCurrentTotalSpots();
    Alert.alert(
      "AI Auto-Assignment",
      `AI will automatically assign interested players to this tee time based on their preferences. This will assign players up to the available capacity of ${availableSpots} spots.`,
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

      // Mock AI assignment logic - select interested members considering guest counts
      const interestedMembers = getInterestedMembers();
      const availableSpots = teeTime.max_players - getCurrentTotalSpots();

      // Select members that fit within available capacity
      const selectedMembers: GroupMember[] = [];
      let usedSpots = 0;

      // Randomly shuffle members for AI selection
      const shuffledMembers = [...interestedMembers].sort(
        () => Math.random() - 0.5
      );

      for (const member of shuffledMembers) {
        const spotsNeeded = getTotalSpotsNeeded(member);
        if (usedSpots + spotsNeeded <= availableSpots) {
          selectedMembers.push(member);
          usedSpots += spotsNeeded;
        }
      }

      // Create assignments with guest names
      const newPlayers: Player[] = [];
      const newGuestNames: { [key: string]: string[] } = {};

      for (const member of selectedMembers) {
        const memberInterest = getMemberInterest(member.id);
        const guestCount = memberInterest?.guest_count || 0;
        const defaultGuestNames = Array.from(
          { length: guestCount },
          (_, i) => `${member.full_name}'s Guest ${i + 1}`
        );

        newPlayers.push({
          id: member.id,
          full_name: member.full_name || "Unknown",
          guest_names: defaultGuestNames,
        });

        if (guestCount > 0) {
          newGuestNames[member.id] = defaultGuestNames;
        }

        const { error } = await supabase.from("assignments").insert({
          tee_time_id: teeTime.id,
          user_id: member.id,
          weekend_id: teeTime.weekend_id,
          ...(guestCount > 0 && { guest_names: defaultGuestNames }),
        });

        if (error) {
          console.error("Error assigning player:", error);
          // Check if this is a capacity constraint error
          if (error.message && error.message.includes("Not enough space")) {
            throw new Error(`Not enough space for ${member.full_name}: ${error.message}`);
          } else {
            throw new Error(`Failed to assign ${member.full_name}`);
          }
        }
      }

      // Update local state
      setAssignedPlayers([...assignedPlayers, ...newPlayers]);
      setGuestNames((prev) => ({ ...prev, ...newGuestNames }));

      // Mark that there were assignment changes
      setHasAssignmentChanges(true);

      const totalSpotsUsed = selectedMembers.reduce((total, member) => {
        return total + getTotalSpotsNeeded(member);
      }, 0);

      Alert.alert(
        "Auto-Assignment Complete",
        `Successfully assigned ${selectedMembers.length} member${
          selectedMembers.length > 1 ? "s" : ""
        } using ${totalSpotsUsed} spot${
          totalSpotsUsed > 1 ? "s" : ""
        } to this tee time.`
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

  if (membersLoading || interestsLoading || pendingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>
          Loading group members and interests...
        </Text>
      </View>
    );
  }

  // Get unassigned pending members (invitations)
  const getAvailablePendingMembers = () => {
    return pendingInvitations.filter(
      (inv) => !assignedPlayers.some((player) => player.id === inv.id)
    );
  };

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
            {getCurrentTotalSpots()} / {teeTime.max_players} spots used
          </Text>

          {/* AI Auto-Assignment Button */}
          {!isFull && getInterestedMembers().length > 0 && (
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
              {assignedPlayers
                .map((player, playerIndex) => {
                  const playerGuestNames = guestNames[player.id] || [];

                  // Create array of all spots (member + guests)
                  const allSpots = [
                    {
                      id: player.id,
                      name: player.full_name,
                      isGuest: false,
                      guestNumber: 0,
                    },
                  ];

                  // Add guest spots from assignment data
                  for (let i = 0; i < playerGuestNames.length; i++) {
                    allSpots.push({
                      id: `${player.id}_guest_${i + 1}`,
                      name: playerGuestNames[i] || `${player.full_name}'s Guest ${i + 1}`,
                      isGuest: true,
                      guestNumber: i + 1,
                    });
                  }

                  const playerId = player.id || `index-${playerIndex}`;

                  return (
                    <React.Fragment key={`assigned-player-${playerId}`}>
                      {allSpots.map((spot) => (
                        <View key={spot.id} style={styles.assignedPlayerCard}>
                          <View style={styles.playerInfo}>
                            <Text style={styles.playerIcon}>
                              {spot.isGuest ? "👥" : "👤"}
                            </Text>
                            {spot.isGuest ? (
                              <Pressable
                                style={styles.editableNameContainer}
                                onPress={() =>
                                  handleEditGuestName(player, spot.guestNumber)
                                }
                              >
                                <Text style={styles.playerName}>
                                  {spot.name}
                                </Text>
                                <Text style={styles.editIcon}>✏️</Text>
                              </Pressable>
                            ) : (
                              <View style={styles.playerNameContainer}>
                                <Text style={styles.playerName}>{spot.name}</Text>
                                {player.is_pending && (
                                  <View style={styles.assignedPendingBadge}>
                                    <Text style={styles.assignedPendingBadgeText}>Pending</Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                          <Pressable
                            style={[
                              styles.removeButton,
                              spot.isGuest && styles.removeButtonDisabled,
                            ]}
                            onPress={() => handleRemovePlayer(player)}
                            disabled={loading || spot.isGuest}
                          >
                            <Text
                              style={[
                                styles.removeButtonText,
                                spot.isGuest && styles.removeButtonTextDisabled,
                              ]}
                            >
                              Remove
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </React.Fragment>
                  );
                })}
            </View>
          )}
        </View>

        {/* Available Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showAllMembers ? "All Members" : "Interested Members"}{" "}
              {isFull && "(Tee Time Full)"}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Show all members</Text>
            <Pressable
              style={[styles.toggle, showAllMembers && styles.toggleActive]}
              onPress={() => setShowAllMembers(!showAllMembers)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  showAllMembers && styles.toggleThumbActive,
                ]}
              />
            </Pressable>
          </View>
          {getAvailableMembers().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isFull
                  ? "Tee time is full"
                  : showAllMembers
                  ? "No available members to assign"
                  : "No members have submitted interest for this date"}
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {getAvailableMembers().map((member) => {
                const memberInterest = getMemberInterest(member.id);
                const isExpanded = expandedCards.has(member.id);
                const primaryPreferences =
                  getPrimaryPreferences(memberInterest);
                const secondaryPreferences = getSecondaryPreferences(
                  memberInterest,
                  members
                );
                const hasSecondaryPreferences = secondaryPreferences.length > 0;

                return (
                  <View key={member.id} style={styles.memberCardContainer}>
                    <Pressable
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
                          {memberInterest && primaryPreferences.length > 0 && (
                            <View style={styles.primaryPreferencesContainer}>
                              <View style={styles.preferencesRow}>
                                {primaryPreferences.map((preference, index) => (
                                  <View
                                    key={index}
                                    style={[
                                      styles.preferenceBadge,
                                      preference.type === "guests" &&
                                        styles.guestBadge,
                                      preference.type === "time" &&
                                        styles.timePreferenceBadge,
                                    ]}
                                  >
                                    <Text style={styles.preferenceIcon}>
                                      {preference.icon}
                                    </Text>
                                    <Text style={styles.preferenceLabel}>
                                      {preference.label}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <Text style={styles.assignButtonText}>Assign</Text>
                      </View>
                    </Pressable>

                    {/* Expandable section */}
                    {memberInterest && hasSecondaryPreferences && (
                      <Pressable
                        style={styles.expandButton}
                        onPress={() => toggleCardExpansion(member.id)}
                      >
                        <Text style={styles.expandButtonText}>
                          {isExpanded ? "Show Less" : "Show More Preferences"}
                        </Text>
                        <Text style={styles.expandIcon}>
                          {isExpanded ? "▲" : "▼"}
                        </Text>
                      </Pressable>
                    )}

                    {/* Expanded preferences */}
                    {isExpanded &&
                      memberInterest &&
                      secondaryPreferences.length > 0 && (
                        <View style={styles.expandedPreferences}>
                          <View style={styles.preferencesRow}>
                            {secondaryPreferences.map((preference, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.preferenceBadge,
                                  preference.type === "transportation" &&
                                    styles.transportationBadge,
                                  preference.type === "partners" &&
                                    styles.partnersBadge,
                                  preference.type === "notes" &&
                                    styles.notesBadge,
                                ]}
                              >
                                <Text style={styles.preferenceIcon}>
                                  {preference.icon}
                                </Text>
                                <Text style={styles.preferenceLabel}>
                                  {preference.label}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Pending Members Section */}
        {getAvailablePendingMembers().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Members {isFull && "(Tee Time Full)"}
            </Text>
            <Text style={styles.pendingSectionNote}>
              These members don't have accounts yet
            </Text>
            <View style={styles.membersList}>
              {getAvailablePendingMembers().map((invitation) => (
                <View key={invitation.id} style={styles.memberCardContainer}>
                  <Pressable
                    style={[
                      styles.memberCard,
                      styles.pendingMemberCard,
                      isFull && styles.memberCardDisabled,
                    ]}
                    onPress={() => handleAssignPendingMember(invitation)}
                    disabled={isFull || loading}
                  >
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberIcon}>👤</Text>
                      <View style={styles.memberDetails}>
                        <View style={styles.pendingNameRow}>
                          <Text style={styles.memberName}>
                            {invitation.display_name || "Unnamed"}
                          </Text>
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        </View>
                        {invitation.invited_email && (
                          <Text style={styles.pendingEmail}>{invitation.invited_email}</Text>
                        )}
                        <View
                          style={[
                            styles.roleBadge,
                            invitation.target_role === "admin"
                              ? styles.roleAdmin
                              : invitation.target_role === "member"
                              ? styles.roleMember
                              : styles.roleGuest,
                          ]}
                        >
                          <Text style={styles.roleText}>{invitation.target_role || "member"}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <Text style={styles.assignButtonText}>Assign</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Guest Name Edit Modal */}
      <Modal
        visible={editingGuest !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingGuest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Guest Name</Text>
            <TextInput
              style={styles.nameInput}
              value={guestNameInput}
              onChangeText={setGuestNameInput}
              placeholder="Enter guest name"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingGuest(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveGuestName}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    justifyContent: "flex-start",
  },
  toggleLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#0ea5e9",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
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
  playerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignedPendingBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignedPendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
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
  removeButtonDisabled: {
    backgroundColor: "#d1d5db",
    opacity: 0.6,
  },
  removeButtonTextDisabled: {
    color: "#9ca3af",
  },
  editableNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  editIcon: {
    marginLeft: 8,
    fontSize: 12,
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  saveButton: {
    backgroundColor: "#0ea5e9",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
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
    alignItems: "flex-start",
    minHeight: 60,
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
  preferencesContainer: {
    marginTop: 8,
    gap: 6,
  },
  preferencesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "flex-start",
  },
  preferenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  preferenceIcon: {
    fontSize: 12,
  },
  preferenceLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
  },
  timePreferenceBadge: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  transportationBadge: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  guestBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#22c55e",
  },
  notesBadge: {
    backgroundColor: "#f3e8ff",
    borderColor: "#a855f7",
  },
  partnersBadge: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
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
    alignSelf: "flex-start",
    marginTop: 4,
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
  memberCardContainer: {
    marginBottom: 8,
  },
  primaryPreferencesContainer: {
    marginTop: 6,
  },
  cardActions: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  expandButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  expandButtonText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  expandIcon: {
    fontSize: 10,
    color: "#64748b",
  },
  expandedPreferences: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
    gap: 8,
  },
  // Pending member styles
  pendingSectionNote: {
    fontSize: 12,
    color: "#92400e",
    marginBottom: 12,
    fontStyle: "italic",
  },
  pendingMemberCard: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  pendingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pendingBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#78350f",
  },
  pendingEmail: {
    fontSize: 11,
    color: "#92400e",
    marginBottom: 4,
  },
});
