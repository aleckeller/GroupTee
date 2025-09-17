import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function CalendarLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>Playing</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Not playing</Text>
        </View>
        <View style={styles.legendItem}>
          <FontAwesome name="lock" size={12} color="#ef4444" />
          <Text style={styles.legendText}>Locked</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: "#fef3c7",
                borderWidth: 2,
                borderColor: "#f59e0b",
                borderRadius: 4,
              },
            ]}
          />
          <Text style={styles.legendText}>Action needed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    marginTop: 20,
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#374151",
  },
});
