import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useStats } from "@/hooks/useStats";
import { useTeeTimes } from "@/hooks/useTeeTimes";
import { useWeekends } from "@/hooks/useWeekends";
import { groupTeeTimesByWeekend } from "@/utils/teeTimeUtils";
import RoleGuard from "@/components/RoleGuard";
import StatsCard from "@/components/StatsCard";
import WeekendSection from "@/components/WeekendSection";

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const { selectedGroup } = useGroup();
  const {
    stats,
    loading: statsLoading,
    refresh: refreshStats,
  } = useStats(selectedGroup?.id || null);
  const {
    teeTimes,
    loading: teeTimesLoading,
    refresh: refreshTeeTimes,
  } = useTeeTimes(selectedGroup?.id || null);
  const {
    weekends,
    loading: weekendsLoading,
    refresh: refreshWeekends,
  } = useWeekends();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh all data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we have a selected group
      if (selectedGroup?.id) {
        refreshTeeTimes();
      }
    }, [selectedGroup?.id])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data in parallel
      await Promise.all([refreshStats(), refreshTeeTimes(), refreshWeekends()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userProfile && (
          <View style={styles.roleIndicator}>
            {userProfile.full_name && (
              <Text style={styles.nameText}>
                Welcome, {userProfile.full_name}
              </Text>
            )}
          </View>
        )}

        <StatsCard stats={stats} loading={statsLoading} />

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <Text>No new notifications</Text>
        </View>

        <Text style={styles.sectionTitle}>Tee Times</Text>
        {weekendsLoading || teeTimesLoading ? (
          <View style={styles.card}>
            <Text>Loading weekends and tee times...</Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Weekends: {weekendsLoading ? "loading" : "loaded"} | TeeTimes:{" "}
              {teeTimesLoading ? "loading" : "loaded"} | Group:{" "}
              {selectedGroup?.id ? "selected" : "none"}
            </Text>
          </View>
        ) : weekends.length === 0 ? (
          <View style={styles.card}>
            <Text>No weekends found</Text>
          </View>
        ) : (
          <View>
            {(() => {
              const teeTimesByWeekend = groupTeeTimesByWeekend(teeTimes);
              let upcomingWeekendsHeadingShown = false;

              return weekends.map((weekend, index) => {
                const weekendTeeTimes =
                  teeTimesByWeekend[weekend.id]?.teeTimes || [];

                // Check if this is a weekend that doesn't get a relative label
                const startDate = new Date(weekend.start_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil(
                  (startDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isUpcomingWeekend = daysDiff >= 14;

                // Show "Upcoming Weekends" heading before the first upcoming weekend
                const shouldShowUpcomingHeading =
                  isUpcomingWeekend && !upcomingWeekendsHeadingShown;
                if (shouldShowUpcomingHeading) {
                  upcomingWeekendsHeadingShown = true;
                }

                return (
                  <View key={weekend.id}>
                    {shouldShowUpcomingHeading && (
                      <Text style={styles.upcomingWeekendsHeader}>
                        Upcoming Weekends
                      </Text>
                    )}
                    <WeekendSection
                      weekendId={weekend.id}
                      weekend={weekend}
                      teeTimes={weekendTeeTimes}
                    />
                  </View>
                );
              });
            })()}
          </View>
        )}
      </ScrollView>
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
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 6,
  },
  upcomingWeekendsHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  roleIndicator: {
    backgroundColor: "#e0f2fe",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
});
