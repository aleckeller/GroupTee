import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGroup } from "@/hooks/useGroup";
import SignOutButton from "@/components/SignOutButton";

export default function GroupPickerScreen() {
  const { groups, selectedGroup, selectGroup, loading, refresh } = useGroup();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <SignOutButton />
        <Text style={styles.header}>Select Group</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.container}>
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
              <Text style={styles.name}>{item.name}</Text>
              {selectedGroup?.id === item.id && (
                <Text style={styles.tag}>Selected</Text>
              )}
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
  itemSelected: { borderColor: "#22c55e" },
  name: { fontSize: 16, fontWeight: "600" },
  tag: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  empty: { alignItems: "center", marginTop: 40 },
});
