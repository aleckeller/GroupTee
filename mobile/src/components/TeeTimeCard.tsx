import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatTime, getAvailabilityStatus } from "@/utils/formatting";
import { TeeTime } from "@/utils/teeTimeUtils";

type TeeTimeCardProps = {
  teeTime: TeeTime;
};

export default function TeeTimeCard({ teeTime }: TeeTimeCardProps) {
  const playerCount = teeTime.players?.length || 0;
  const availability = getAvailabilityStatus(playerCount, teeTime.max_players);

  return (
    <View style={styles.teeItem}>
      <View style={styles.teeTimeHeader}>
        <View style={styles.teeTimeInfo}>
          <Text style={styles.teeTime}>{formatTime(teeTime.tee_time)}</Text>
          <Text style={styles.holeInfo}>Max {teeTime.max_players} players</Text>
        </View>
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
      </View>

      <View style={styles.playersContainer}>
        {teeTime.players && teeTime.players.length > 0 ? (
          <View style={styles.playersList}>
            {teeTime.players.map((player) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerIcon}>👤</Text>
                <Text style={styles.playerName}>{player.full_name}</Text>
              </View>
            ))}
            {/* Show empty slots */}
            {Array.from({
              length: teeTime.max_players - playerCount,
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
  },
  playerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  playerName: {
    fontSize: 14,
    color: "#334155",
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
