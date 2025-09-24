import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatting";
import { setJustReturnedFromAssignment } from "@/utils/navigationState";
import TeeTimeCard from "./TeeTimeCard";
import { TeeTime, WeekendSectionProps } from "../types";

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

function groupTeeTimesByDay(teeTimes: TeeTime[]) {
  const grouped: { [key: string]: TeeTime[] } = {};

  teeTimes.forEach((teeTime) => {
    const dayKey = teeTime.tee_date;
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push(teeTime);
  });

  // Sort days chronologically
  const sortedDays = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return sortedDays.map((day) => ({
    date: day,
    teeTimes: grouped[day],
  }));
}

export default function WeekendSection({
  weekendId,
  weekend,
  teeTimes,
  interests,
}: WeekendSectionProps) {
  const navigation = useNavigation();
  const { userProfile, user } = useAuth();
  const relativeLabel = getRelativeWeekendLabel(
    weekend.start_date,
    weekend.end_date
  );

  const groupedByDay = groupTeeTimesByDay(teeTimes);

  const handleTeeTimePress = (teeTime: TeeTime) => {
    // Only allow admins to navigate to assignment screen
    if (userProfile?.role === "admin") {
      // Set flag to indicate we're going to assignment screen
      setJustReturnedFromAssignment(true);
      (navigation as any).navigate("TeeTimeAssignment", { teeTime });
    }
  };

  return (
    <View key={weekendId} style={styles.weekendSection}>
      {relativeLabel && (
        <Text style={styles.weekendHeader}>{relativeLabel}</Text>
      )}
      {groupedByDay.length > 0 ? (
        groupedByDay.map((dayGroup) => (
          <View key={dayGroup.date} style={styles.dayGroup}>
            <Text style={styles.dayHeader}>{formatDate(dayGroup.date)}</Text>
            {dayGroup.teeTimes.map((teeTime) => (
              <TeeTimeCard
                key={teeTime.id}
                teeTime={teeTime}
                onPress={() => handleTeeTimePress(teeTime)}
                currentUserId={user?.id}
                interests={interests}
              />
            ))}
          </View>
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
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
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
