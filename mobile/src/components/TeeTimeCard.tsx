import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { formatTime, getAvailabilityStatus } from "@/utils/formatting";
import { TeeTimeCardProps } from "../types";

export default function TeeTimeCard({
  teeTime,
  onPress,
  onDelete,
  isAdmin,
  currentUserId,
}: TeeTimeCardProps) {
  const playerCount = teeTime.players?.length || 0;

  // Calculate total spots used including guests
  const getTotalSpotsUsed = () => {
    if (!teeTime.players) return playerCount;

    return teeTime.players.reduce((total, player) => {
      return total + 1 + (player.guest_names?.length || 0);
    }, 0);
  };

  const totalSpotsUsed = getTotalSpotsUsed();
  const availability = getAvailabilityStatus(
    totalSpotsUsed,
    teeTime.max_players
  );

  const hasPlayers = playerCount > 0;

  const handleDelete = () => {
    Alert.alert(
      "Delete Tee Time",
      "Are you sure you want to delete this tee time?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  const CardContent = () => (
    <>
      <View style={styles.teeTimeHeader}>
        <View style={styles.teeTimeInfo}>
          <Text style={styles.teeTime}>{formatTime(teeTime.tee_time)}</Text>
          <Text style={styles.holeInfo}>Max {teeTime.max_players} players</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: availability.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: availability.color }]}>
              {availability.status}
            </Text>
          </View>
          {isAdmin && onDelete && (
            <Pressable
              style={[styles.deleteButton, hasPlayers && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              hitSlop={8}
              disabled={hasPlayers}
            >
              <Text style={[styles.deleteButtonText, hasPlayers && styles.deleteButtonTextDisabled]}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.playersContainer}>
        {teeTime.players && teeTime.players.length > 0 ? (
          <View style={styles.playersList}>
            {teeTime.players
              .map((player, playerIndex) => {
                const isCurrentUser =
                  currentUserId && player.id === currentUserId;

                const playerId = player.id || `index-${playerIndex}`;
                const playerGuestNames = player.guest_names || [];

                // Create array of all spots (member + guests)
                const allSpots = [
                  {
                    id: playerId,
                    name: player.full_name,
                    isGuest: false,
                    isCurrentUser,
                  },
                ];

                // Add guest spots from assignment data
                for (let i = 0; i < playerGuestNames.length; i++) {
                  allSpots.push({
                    id: `${playerId}_guest_${i}`,
                    name: playerGuestNames[i] || `${player.full_name}'s Guest ${i + 1}`,
                    isGuest: true,
                    isCurrentUser: false,
                  });
                }

                return (
                  <React.Fragment key={`player-${playerId}`}>
                    {allSpots.map((spot) => (
                      <View
                        key={spot.id}
                        style={[
                          styles.playerItem,
                          spot.isCurrentUser && styles.currentUserPlayer,
                          spot.isGuest && styles.guestPlayer,
                        ]}
                      >
                        <Text style={styles.playerIcon}>
                          {spot.isGuest ? "👥" : "👤"}
                        </Text>
                        <Text
                          style={[
                            styles.playerName,
                            spot.isCurrentUser && styles.currentUserName,
                            spot.isGuest && styles.guestPlayerName,
                          ]}
                        >
                          {spot.name}
                        </Text>
                      </View>
                    ))}
                  </React.Fragment>
                );
              })}
            {/* Show empty slots */}
            {Array.from({
              length: teeTime.max_players - getTotalSpotsUsed(),
            }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>Available</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.playersList}>
            {Array.from({ length: teeTime.max_players }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>Available</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.teeItem} onPress={onPress}>
        <CardContent />
      </Pressable>
    );
  }

  return (
    <View style={styles.teeItem}>
      <CardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  teeItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  teeTimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  teeTimeInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButtonDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    opacity: 0.5,
  },
  deleteButtonTextDisabled: {
    color: "#94a3b8",
  },
  teeTime: {
    fontWeight: "700",
    fontSize: 18,
    color: "#1e293b",
    marginBottom: 4,
  },
  holeInfo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  playersContainer: {
    marginTop: 8,
  },
  playersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-start",
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#16a34a",
    flex: 1,
    minWidth: "45%",
    maxWidth: "100%",
    minHeight: 36,
  },
  currentUserPlayer: {
    backgroundColor: "#f0f9ff",
    borderLeftColor: "#0ea5e9",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    shadowColor: "#0ea5e9",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  playerName: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    flex: 1,
    flexWrap: "wrap",
  },
  currentUserName: {
    color: "#0c4a6e",
    fontWeight: "600",
  },
  guestPlayer: {
    backgroundColor: "#f0fdf4",
    borderLeftColor: "#22c55e",
  },
  guestPlayerName: {
    color: "#166534",
    fontWeight: "500",
  },
  emptySlot: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
  },
  emptySlotText: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
  },
});
