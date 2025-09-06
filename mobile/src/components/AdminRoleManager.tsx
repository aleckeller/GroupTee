import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import RoleGuard from "./RoleGuard";
import { User, UserRole } from "../types";

export default function AdminRoleManager() {
  const { userProfile } = useAuth();
  const { selectedGroup } = useGroup();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedGroup?.id) {
      fetchUsers();
    }
  }, [selectedGroup?.id]);

  const fetchUsers = async () => {
    if (!selectedGroup?.id) return;

    try {
      const { data, error } = await supabase
        .from("memberships")
        .select(
          `
          id,
          role,
          profiles!inner(
            id,
            full_name
          )
        `
        )
        .eq("group_id", selectedGroup.id)
        .order("profiles(full_name)", { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const formattedUsers: User[] = (data || []).map((membership: any) => ({
        id: membership.profiles.id,
        full_name: membership.profiles.full_name,
        role: membership.role as UserRole,
        membership_id: membership.id,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error in fetchUsers:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (membershipId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", membershipId);

      if (error) {
        Alert.alert("Error", `Failed to update role: ${error.message}`);
        return;
      }

      Alert.alert("Success", "User role updated successfully");
      fetchUsers(); // Refresh the list
    } catch (error) {
      Alert.alert("Error", "Failed to update user role");
    }
  };

  const confirmRoleChange = (user: User, newRole: UserRole) => {
    if (user.id === userProfile?.id) {
      Alert.alert("Warning", "You cannot change your own role");
      return;
    }

    Alert.alert(
      "Confirm Role Change",
      `Are you sure you want to change ${user.full_name || user.id} from ${
        user.role
      } to ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateUserRole(user.membership_id, newRole),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.full_name || item.id}</Text>
        {item.full_name && <Text style={styles.userName}>ID: {item.id}</Text>}
        <View
          style={[
            styles.roleBadge,
            item.role === "admin"
              ? styles.roleAdmin
              : item.role === "member"
              ? styles.roleMember
              : item.role === "guest"
              ? styles.roleGuest
              : undefined,
          ]}
        >
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
      </View>

      <View style={styles.roleButtons}>
        {item.role !== "admin" && (
          <Pressable
            style={[styles.roleButton, styles.adminButton]}
            onPress={() => confirmRoleChange(item, "admin")}
          >
            <Text style={styles.buttonText}>Make Admin</Text>
          </Pressable>
        )}
        {item.role !== "member" && (
          <Pressable
            style={[styles.roleButton, styles.memberButton]}
            onPress={() => confirmRoleChange(item, "member")}
          >
            <Text style={styles.buttonText}>Make Member</Text>
          </Pressable>
        )}
        {item.role !== "guest" && (
          <Pressable
            style={[styles.roleButton, styles.guestButton]}
            onPress={() => confirmRoleChange(item, "guest")}
          >
            <Text style={styles.buttonText}>Make Guest</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  if (!selectedGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>User Role Management</Text>
        <Text style={styles.subtitle}>
          Please select a group to manage user roles
        </Text>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <View style={styles.container}>
        <Text style={styles.header}>User Role Management</Text>
        <Text style={styles.subtitle}>
          Manage user roles for {selectedGroup.name}
        </Text>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleAdmin: {
    backgroundColor: "#fef2f2",
  },
  roleMember: {
    backgroundColor: "#f0fdf4",
  },
  roleGuest: {
    backgroundColor: "#fef3c7",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  roleButtons: {
    flexDirection: "row",
    gap: 8,
  },
  roleButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  adminButton: {
    backgroundColor: "#dc2626",
  },
  memberButton: {
    backgroundColor: "#059669",
  },
  guestButton: {
    backgroundColor: "#d97706",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
