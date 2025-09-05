import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatDate } from "@/utils/formatting";
import TeeTimeCard from "./TeeTimeCard";
import { TeeTime } from "@/utils/teeTimeUtils";

function getRelativeWeekendLabel(
  startDate: string,
  endDate: string
): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // Reset time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const daysDiff = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    return "This Weekend";
  } else if (daysDiff === 7) {
    return "Next Weekend";
  } else if (daysDiff > 0 && daysDiff < 7) {
    return "This Weekend";
  } else if (daysDiff > 7 && daysDiff < 14) {
    return "Next Weekend";
  } else {
    // For dates further out, return null so we don't show a header
    return null;
  }
}

type WeekendSectionProps = {
  weekendId: string;
  weekend: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  teeTimes: TeeTime[];
};

export default function WeekendSection({
  weekendId,
  weekend,
  teeTimes,
}: WeekendSectionProps) {
  const relativeLabel = getRelativeWeekendLabel(
    weekend.start_date,
    weekend.end_date
  );

  return (
    <View key={weekendId} style={styles.weekendSection}>
      {relativeLabel && (
        <Text style={styles.weekendHeader}>{relativeLabel}</Text>
      )}
      <Text style={styles.weekendDates}>
        {formatDate(weekend.start_date)} - {formatDate(weekend.end_date)}
      </Text>
      {teeTimes.length > 0 ? (
        teeTimes.map((teeTime) => (
          <TeeTimeCard key={teeTime.id} teeTime={teeTime} />
        ))
      ) : (
        <View style={styles.noTeeTimesCard}>
          <Text style={styles.noTeeTimesText}>No tee times scheduled</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  weekendSection: {
    marginBottom: 24,
  },
  weekendHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  weekendDates: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  noTeeTimesCard: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  noTeeTimesText: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
});
