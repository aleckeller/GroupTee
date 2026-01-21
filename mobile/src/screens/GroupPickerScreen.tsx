import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGroup } from "@/hooks/useGroup";
import SignOutButton from "@/components/SignOutButton";
import { GroupWithMembership } from "@/types";

export default function GroupPickerScreen() {
  const { groups, selectedGroup, selectGroup, setPrimaryGroup, loading, refresh } = useGroup();
  const [showInfo, setShowInfo] = useState(false);

  const handleTogglePrimary = async (group: GroupWithMembership) => {
    if (!group.is_primary) {
      await setPrimaryGroup(group.id);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <SignOutButton />
        <Text style={styles.header}>Select Group</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.container}>
        <Pressable style={styles.infoBar} onPress={() => setShowInfo(true)}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>i</Text>
          </View>
          <Text style={styles.infoText}>What is a primary group?</Text>
        </Pressable>

        <FlatList
          refreshing={loading}
          onRefresh={refresh}
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => selectGroup(item)}
              style={[
                styles.item,
                selectedGroup?.id === item.id && styles.itemSelected,
              ]}
            >
              <View style={styles.itemContent}>
                <Text style={styles.name}>{item.name}</Text>
                {selectedGroup?.id === item.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <View style={styles.primaryToggle}>
                <Text style={styles.primaryLabel}>Primary</Text>
                <Switch
                  value={item.is_primary}
                  onValueChange={() => handleTogglePrimary(item)}
                  trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                  thumbColor={item.is_primary ? "#2563eb" : "#94a3b8"}
                  disabled={item.is_primary}
                />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text>No groups found</Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Primary Group</Text>
            <Text style={styles.modalBody}>
              Your primary group is used to determine which group gets credit when you win a tee time in the lottery.
              {"\n\n"}
              If you belong to multiple groups, make sure to set your primary group to the one you want to represent.
            </Text>
            <Pressable style={styles.modalButton} onPress={() => setShowInfo(false)}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "700" },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  infoText: {
    color: "#1e40af",
    fontSize: 14,
    fontWeight: "500",
  },
  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemSelected: { borderColor: "#22c55e", borderWidth: 2 },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: { fontSize: 16, fontWeight: "600" },
  selectedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  selectedBadgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "600",
  },
  primaryToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
  },
  empty: { alignItems: "center", marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
