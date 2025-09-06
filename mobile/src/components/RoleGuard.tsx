import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { colors, typography, spacing } from "../styles/theme";
import { RoleGuardProps } from "../types";

export default function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Please log in.</Text>
      </View>
    );
  }

  if (!allowedRoles.includes(userProfile.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>
          You don't have permission to view this screen.
        </Text>
        <Text style={styles.role}>Your role: {userProfile.role}</Text>
        <Text style={styles.required}>
          Required roles: {allowedRoles.join(", ")}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.base,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  role: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  required: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadingText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.base,
    color: colors.error,
  },
});
