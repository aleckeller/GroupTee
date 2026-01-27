import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { colors, typography, spacing, borderRadius } from "@/styles/theme";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: colors.adminLight, text: colors.admin },
  member: { bg: colors.memberLight, text: colors.member },
  guest: { bg: colors.guestLight, text: colors.guest },
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export default function AccountScreen() {
  const { user, userProfile, signOut } = useAuth();
  const { selectedGroup, selectGroup } = useGroup();

  const role = userProfile?.role ?? "guest";
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.guest;
  const initials = getInitials(userProfile?.full_name ?? null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {userProfile?.full_name && (
          <Text style={styles.name}>{userProfile.full_name}</Text>
        )}
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
          <Text style={[styles.roleBadgeText, { color: roleColor.text }]}>
            {role}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {selectedGroup && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Group</Text>
          <Text style={styles.cardValue}>{selectedGroup.name}</Text>
          <Pressable
            style={styles.switchButton}
            onPress={() => selectGroup(null)}
          >
            <Text style={styles.switchButtonText}>Switch Group</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.divider} />

      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: "#fff",
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
  },
  name: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  cardLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  switchButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  switchButtonText: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  signOutButton: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  signOutText: {
    color: colors.error,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
});
