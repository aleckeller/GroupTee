import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { colors } from "@/styles/theme";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: colors.adminLight, text: colors.admin },
  member: { bg: colors.memberLight, text: colors.member },
  guest: { bg: colors.guestLight, text: colors.guest },
};

export default function HeaderTitle() {
  const { userProfile } = useAuth();
  const { selectedGroup, selectGroup } = useGroup();

  if (!selectedGroup) return null;

  const role = userProfile?.role ?? "guest";
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.guest;

  return (
    <Pressable onPress={() => selectGroup(null)} style={styles.container}>
      <Text style={styles.groupName} numberOfLines={1}>
        {selectedGroup.name}
      </Text>
      <View style={[styles.badge, { backgroundColor: roleColor.bg }]}>
        <Text style={[styles.badgeText, { color: roleColor.text }]}>
          {role}
        </Text>
      </View>
      <Ionicons
        name="chevron-down"
        size={14}
        color={colors.textMuted}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    maxWidth: 150,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  chevron: {
    marginLeft: 2,
  },
});
