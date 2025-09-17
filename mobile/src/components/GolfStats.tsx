import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface GolfStatsProps {
  interestsData: any[];
  availableDatesCount: number;
}

export default function GolfStats({
  interestsData,
  availableDatesCount,
}: GolfStatsProps) {
  const daysPlaying = interestsData.filter(
    (interest) => interest.wants_to_play === true
  ).length;
  const daysDeclined = interestsData.filter(
    (interest) => interest.wants_to_play === false
  ).length;
  const pending = availableDatesCount - interestsData.length;

  return (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Your Golf Schedule</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{daysPlaying}</Text>
          <Text style={styles.statLabel}>Days Playing</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{daysDeclined}</Text>
          <Text style={styles.statLabel}>Days Declined</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0ea5e9",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
