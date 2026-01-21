import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useClubs } from "@/hooks/useClubs";
import { useAuth } from "@/hooks/useAuth";
import { AdminStackParamList } from "@/types";

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

export default function ClubAdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useAuth();
  const { clubs, loading, refresh } = useClubs();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Club Admin</Text>
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
        <Text style={styles.sectionTitle}>My Clubs</Text>

        {loading ? (
          <View style={styles.card}>
            <Text style={styles.loadingText}>Loading clubs...</Text>
          </View>
        ) : clubs.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              You are not an admin of any clubs yet.
            </Text>
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
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
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
  chevron: {
    fontSize: 24,
    color: "#94a3b8",
    marginLeft: 8,
  },
});
