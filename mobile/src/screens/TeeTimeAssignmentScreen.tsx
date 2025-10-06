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
import {
  useInterestsForDate,
  InterestWithProfile,
} from "@/hooks/useInterestsForDate";
import { formatDate, formatTime } from "@/utils/formatting";
import { setHasAssignmentChanges } from "@/utils/navigationState";
import { GroupMember, TeeTime, Player } from "../types";
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
  const { interests, loading: interestsLoading } = useInterestsForDate(
    teeTime.tee_date,
    selectedGroup?.id || null
  );

  const [assignedPlayers, setAssignedPlayers] = useState<Player[]>(
    teeTime.players || []
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

  // Load existing guest names when component mounts
  useEffect(() => {
    const loadGuestNames = async () => {
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("user_id, guest_names")
          .eq("tee_time_id", teeTime.id);

        if (error) {
          console.error("Error loading guest names:", error);
          return;
        }

        const guestNamesMap: { [key: string]: string[] } = {};
        data?.forEach((assignment) => {
          if (assignment.guest_names && assignment.guest_names.length > 0) {
            guestNamesMap[assignment.user_id] = assignment.guest_names;
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
      // Find the member's interest to get their guest count
      const memberInterest = interests?.find(
        (interest) => interest.user_id === player.id
      );
      return total + 1 + (memberInterest?.guest_count || 0);
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

  const handleRemovePlayer = async (player: Player) => {
    const memberInterest = interests?.find(
      (interest) => interest.user_id === player.id
    );
    const guestCount = memberInterest?.guest_count || 0;

    const guestText =
      guestCount > 0
        ? ` and their ${guestCount} guest${guestCount > 1 ? "s" : ""}`
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

      // Mark that there were assignment changes
      setHasAssignmentChanges(true);

      const memberInterest = interests?.find(
        (interest) => interest.user_id === player.id
      );
      const guestCount = memberInterest?.guest_count || 0;
      const guestText =
        guestCount > 0
          ? ` and their ${guestCount} guest${guestCount > 1 ? "s" : ""}`
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

  if (membersLoading || interestsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>
          Loading group members and interests...
        </Text>
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
                  const memberInterest = interests?.find(
                    (interest) => interest.user_id === player.id
                  );
                  const guestCount = memberInterest?.guest_count || 0;

                  // Create array of all spots (member + guests)
                  const allSpots = [
                    {
                      id: player.id,
                      name: player.full_name,
                      isGuest: false,
                      guestNumber: 0,
                    },
                  ];

                  // Add guest spots
                  const playerGuestNames = guestNames[player.id] || [];
                  for (let i = 1; i <= guestCount; i++) {
                    const guestName =
                      playerGuestNames[i - 1] ||
                      `${player.full_name}'s Guest ${i}`;
                    allSpots.push({
                      id: `${player.id}_guest_${i}`,
                      name: guestName,
                      isGuest: true,
                      guestNumber: i,
                    });
                  }

                  return (
                    <React.Fragment key={`assigned-player-${player.id}`}>
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
                              <Text style={styles.playerName}>{spot.name}</Text>
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
                })
                .flat()}
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
});
