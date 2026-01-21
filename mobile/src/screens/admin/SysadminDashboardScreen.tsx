import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useClubs } from "@/hooks/useClubs";
import { useAuth } from "@/hooks/useAuth";
import { AdminStackParamList, Club } from "@/types";

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

export default function SysadminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useAuth();
  const { clubs, loading, createClub, deleteClub, refresh } = useClubs();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubWebsite, setNewClubWebsite] = useState("");
  const [creating, setCreating] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateClub = async () => {
    if (!newClubName.trim()) {
      Alert.alert("Error", "Please enter a club name");
      return;
    }

    setCreating(true);
    const result = await createClub(
      newClubName.trim(),
      newClubWebsite.trim() || undefined
    );
    setCreating(false);

    if (result.error) {
      Alert.alert("Error", result.error);
    } else {
      setShowCreateModal(false);
      setNewClubName("");
      setNewClubWebsite("");
    }
  };

  const handleDeleteClub = (club: Club) => {
    Alert.alert(
      "Delete Club",
      `Are you sure you want to delete "${club.name}"? This will also delete all groups and memberships within this club.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteClub(club.id);
            if (result.error) {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>System Admin</Text>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clubs</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Club</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.card}>
            <Text style={styles.loadingText}>Loading clubs...</Text>
          </View>
        ) : clubs.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No clubs yet. Create one to get started.</Text>
          </View>
        ) : (
          clubs.map((club) => (
            <Pressable
              key={club.id}
              style={styles.clubCard}
              onPress={() => navigation.navigate("ClubDetail", { clubId: club.id })}
            >
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>{club.name}</Text>
                {club.website_url && (
                  <Text style={styles.clubWebsite}>{club.website_url}</Text>
                )}
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteClub(club)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Club</Text>
            <Pressable onPress={handleCreateClub} disabled={creating}>
              <Text style={[styles.saveText, creating && styles.saveTextDisabled]}>
                {creating ? "Creating..." : "Create"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Club Name *</Text>
            <TextInput
              style={styles.input}
              value={newClubName}
              onChangeText={setNewClubName}
              placeholder="Enter club name"
              autoFocus
            />

            <Text style={styles.inputLabel}>Website URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={newClubWebsite}
              onChangeText={setNewClubWebsite}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  signOutText: {
    color: "#dc2626",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
  },
  addButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    color: "#64748b",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  clubCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  clubWebsite: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  cancelText: {
    color: "#64748b",
    fontSize: 16,
  },
  saveText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#94a3b8",
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
