import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import RoleGuard from "@/components/RoleGuard";

export default function GuestScheduleScreen() {
  const { userProfile } = useAuth();

  return (
    <RoleGuard allowedRoles={["guest", "member", "admin"]}>
      <View style={styles.container}>
        <Text style={styles.header}>Guest Schedule</Text>

        {userProfile && (
          <View style={styles.roleIndicator}>
            <Text style={styles.roleText}>Role: {userProfile.role}</Text>
            {userProfile.full_name && (
              <Text style={styles.nameText}>
                Welcome, {userProfile.full_name}
              </Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.title}>Saturday</Text>
          <Text>8:10 AM - North - Group A</Text>
          <Text>8:20 AM - North - Group B</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Sunday</Text>
          <Text>8:15 AM - North - Group A</Text>
          <Text>8:25 AM - North - Group B</Text>
        </View>
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: { fontWeight: "700", marginBottom: 6 },
  roleIndicator: {
    backgroundColor: "#e0f2fe",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0284c7",
  },
  nameText: {
    fontSize: 14,
    color: "#374151",
    marginTop: 4,
  },
});
