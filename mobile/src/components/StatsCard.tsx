import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Stat = {
  id: string;
  label: string;
  value: number;
};

type StatsCardProps = {
  stats: Stat[];
  loading: boolean;
};

export default function StatsCard({ stats, loading }: StatsCardProps) {
  return (
    <View style={styles.statsRow}>
      {stats.map((s) => (
        <View key={s.id} style={styles.statCard}>
          <Text style={styles.statValue}>{loading ? "…" : s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "#64748b",
  },
});
