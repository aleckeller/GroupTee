import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Notification } from "../types";
import { formatDistanceToNow } from "date-fns";

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function NotificationCard({
  notification,
  onPress,
  onDelete,
}: NotificationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <Pressable
      style={[styles.container, !notification.read && styles.unreadContainer]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {notification.message.includes("added") ? "➕" : "➖"}
        </Text>
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.message, !notification.read && styles.unreadMessage]}
        >
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
      {onDelete && (
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unreadContainer: {
    backgroundColor: "#f8fafc",
    borderColor: "#0ea5e9",
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    color: "#0ea5e9",
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#1e293b",
  },
  timestamp: {
    fontSize: 12,
    color: "#64748b",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea5e9",
    marginLeft: 8,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
});
