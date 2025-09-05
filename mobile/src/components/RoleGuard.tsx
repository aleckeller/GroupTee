import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";

type RoleGuardProps = {
  allowedRoles: ("admin" | "member" | "guest")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>Access denied. Please log in.</Text>
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
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  role: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  required: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
