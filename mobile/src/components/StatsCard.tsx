import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../styles/theme";
import { StatsCardProps } from "../types";

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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
});
