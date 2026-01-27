import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationCard from "@/components/NotificationCard";
import { colors, typography, spacing } from "@/styles/theme";
import { Notification } from "@/types";

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onPress={() => !item.read && markAsRead(item.id)}
      onDelete={() => deleteNotification(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 && unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadLabel}>
            {unreadCount} unread
          </Text>
          <Pressable onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  unreadLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  markAllText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.primary,
  },
  list: {
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
