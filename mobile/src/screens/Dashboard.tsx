import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useStats } from "@/hooks/useStats";
import { useTeeTimes } from "@/hooks/useTeeTimes";
import { useMyTeeTimes } from "@/hooks/useMyTeeTimes";
import { useWeekends } from "@/hooks/useWeekends";
import { useNotifications } from "@/hooks/useNotifications";
import { useGroupInterests } from "@/hooks/useGroupInterests";
import { groupTeeTimesByWeekend } from "@/utils/teeTimeUtils";
import StatsCard from "@/components/StatsCard";
import WeekendSection from "@/components/WeekendSection";
import NotificationCard from "@/components/NotificationCard";

import {
  getJustReturnedFromAssignment,
  getHasAssignmentChanges,
  clearAssignmentState,
} from "@/utils/navigationState";

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { selectedGroup } = useGroup();
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const [notificationsDeleted, setNotificationsDeleted] = useState(false);
  const {
    stats,
    loading: statsLoading,
    refresh: refreshStats,
  } = useStats(selectedGroup?.id || null);
  const {
    teeTimes,
    loading: teeTimesLoading,
    refresh: refreshTeeTimes,
    deleteTeeTime,
  } = useTeeTimes(selectedGroup?.id || null);
  const {
    weekends,
    loading: weekendsLoading,
    refresh: refreshWeekends,
  } = useWeekends();
  const {
    myTeeTimes,
    loading: myTeeTimesLoading,
    refresh: refreshMyTeeTimes,
  } = useMyTeeTimes(user?.id || null);
  const {
    notifications,
    loading: notificationsLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: refreshNotifications,
  } = useNotifications(user?.id || null);
  const {
    interests,
    loading: interestsLoading,
    refresh: refreshInterests,
  } = useGroupInterests(selectedGroup?.id || null);
  const [refreshing, setRefreshing] = useState(false);

  // Handle tee time deletion and refresh stats
  const handleDeleteTeeTime = async (teeTimeId: string) => {
    const success = await deleteTeeTime(teeTimeId);
    if (success) {
      refreshStats();
    }
  };

  // Track when notifications are modified to prevent unnecessary refreshes
  const handleDeleteNotification = (notificationId: string) => {
    setNotificationsDeleted(true);
    deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    setNotificationsDeleted(true);
    markAllAsRead();
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const justReturned = getJustReturnedFromAssignment();
      const hasChanges = getHasAssignmentChanges();

      if (justReturned) {
        // Clear the assignment state flags
        clearAssignmentState();

        // If there were assignment changes, refresh the data
        if (hasChanges) {
          if (selectedGroup?.id) {
            refreshTeeTimes();
            refreshMyTeeTimes();
            refreshInterests();
          }
        }
      }

      // Normal refresh when not returning from assignment
      if (selectedGroup?.id) {
        refreshTeeTimes();
        refreshMyTeeTimes();
        refreshInterests();
      }
      // Only refresh notifications if none were deleted in this session
      if (!notificationsDeleted) {
        refreshNotifications();
      }
    }, [
      selectedGroup?.id,
      refreshTeeTimes,
      refreshMyTeeTimes,
      refreshInterests,
      refreshNotifications,
      notificationsDeleted,
    ])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    setNotificationsDeleted(false); // Allow notifications refresh
    try {
      await Promise.all([
        refreshStats(),
        refreshTeeTimes(),
        refreshMyTeeTimes(),
        refreshWeekends(),
        refreshInterests(),
        refreshNotifications(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
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

      <StatsCard
        stats={stats.filter((stat) => stat.label !== "Trades")}
        loading={statsLoading}
      />

      <View style={styles.notificationsHeader}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
        {notifications.length > 0 && (
          <Pressable
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 && styles.markAllTextDisabled,
              ]}
            >
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {notificationsLoading ? (
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <View style={styles.notificationsContainer}>
          {notifications.slice(0, 5).map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => !notification.read && markAsRead(notification.id)}
              onDelete={() => handleDeleteNotification(notification.id)}
            />
          ))}
          {notifications.length > 5 && (
            <View style={styles.moreNotifications}>
              <Text style={styles.moreText}>
                +{notifications.length - 5} more notifications
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Tee Times</Text>
      <View style={styles.tabContainer}>
        <Pressable
          style={[
            styles.tabButton,
            viewMode === "all" && styles.tabButtonActive,
          ]}
          onPress={() => setViewMode("all")}
        >
          <Text
            style={[styles.tabText, viewMode === "all" && styles.tabTextActive]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            viewMode === "my" && styles.tabButtonActive,
          ]}
          onPress={() => setViewMode("my")}
        >
          <Text
            style={[styles.tabText, viewMode === "my" && styles.tabTextActive]}
          >
            My Times
          </Text>
        </Pressable>
      </View>
      {weekendsLoading ||
      (viewMode === "all" ? teeTimesLoading : myTeeTimesLoading) ? (
        <View style={styles.card}>
          <Text>Loading weekends and tee times...</Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Weekends: {weekendsLoading ? "loading" : "loaded"} | TeeTimes:{" "}
            {viewMode === "all"
              ? teeTimesLoading
                ? "loading"
                : "loaded"
              : myTeeTimesLoading
              ? "loading"
              : "loaded"}{" "}
            | Group: {selectedGroup?.id ? "selected" : "none"}
          </Text>
        </View>
      ) : weekends.length === 0 ? (
        <View style={styles.card}>
          <Text>No weekends found</Text>
        </View>
      ) : (
        (() => {
          const currentTeeTimes = viewMode === "all" ? teeTimes : myTeeTimes;
          return currentTeeTimes.length === 0 ? (
            <View style={styles.card}>
              <Text>
                {viewMode === "all"
                  ? "No tee times found"
                  : "No tee times assigned to you"}
              </Text>
            </View>
          ) : (
            <View>
              {(() => {
                const teeTimesByWeekend =
                  groupTeeTimesByWeekend(currentTeeTimes);
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
                        interests={interests}
                        onDeleteTeeTime={handleDeleteTeeTime}
                      />
                    </View>
                  );
                });
              })()}
            </View>
          );
        })()
      )}
    </ScrollView>
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
  notificationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  unreadBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "500",
  },
  markAllTextDisabled: {
    color: "#94a3b8",
  },
  notificationsContainer: {
    marginBottom: 10,
  },
  moreNotifications: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  moreText: {
    color: "#64748b",
    fontSize: 14,
    fontStyle: "italic",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#1e293b",
    fontWeight: "600",
  },
});
