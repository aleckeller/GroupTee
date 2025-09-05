import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { supabase } from "@/lib/supabase";
import { useGroup } from "@/hooks/useGroup";
import RoleGuard from "@/components/RoleGuard";

type Trade = {
  id: string;
  weekend_id: string;
  from_group_id: string;
  to_group_id: string;
  from_tee_time_id: string;
  to_tee_time_id: string;
  initiated_by: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  from_group: { name: string };
  to_group: { name: string };
  from_tee_time: { tee_time: string };
  to_tee_time: { tee_time: string };
};

export default function TradesScreen() {
  const { selectedGroup } = useGroup();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrades = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from("trades")
        .select(
          `
          *,
          from_group:from_group_id(name),
          to_group:to_group_id(name),
          from_tee_time:from_tee_time_id(tee_time),
          to_tee_time:to_tee_time_id(tee_time)
        `
        )
        .or(
          `from_group_id.eq.${selectedGroup.id},to_group_id.eq.${selectedGroup.id}`
        )
        .order("created_at", { ascending: false });

      setTrades(data || []);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, [selectedGroup]);

  const renderTrade = ({ item }: { item: Trade }) => {
    const isIncoming = item.to_group_id === selectedGroup?.id;
    const isOutgoing = item.from_group_id === selectedGroup?.id;

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <Text style={styles.tradeType}>
            {isIncoming ? "Incoming" : isOutgoing ? "Outgoing" : "Unknown"}{" "}
            Trade
          </Text>
          <Text style={[styles.status, styles[item.status]]}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.tradeDetails}>
          {item.from_group.name} ({item.from_tee_time.tee_time}) ↔{" "}
          {item.to_group.name} ({item.to_tee_time.tee_time})
        </Text>

        {item.status === "pending" && isIncoming && (
          <View style={styles.actionButtons}>
            <Pressable style={[styles.button, styles.acceptButton]}>
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.rejectButton]}>
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <View style={styles.container}>
        <Text style={styles.header}>Group Trades</Text>
        {selectedGroup && (
          <Text style={styles.subtitle}>Trades for {selectedGroup.name}</Text>
        )}

        <FlatList
          data={trades}
          keyExtractor={(item) => item.id}
          renderItem={renderTrade}
          refreshing={loading}
          onRefresh={loadTrades}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text>No trades found</Text>
              </View>
            ) : null
          }
        />
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 16 },
  tradeCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tradeType: { fontWeight: "700", fontSize: 16 },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  accepted: { backgroundColor: "#d1fae5", color: "#065f46" },
  rejected: { backgroundColor: "#fee2e2", color: "#991b1b" },
  tradeDetails: { fontSize: 14, color: "#374151", marginBottom: 12 },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: { backgroundColor: "#10b981" },
  rejectButton: { backgroundColor: "#ef4444" },
  buttonText: { color: "#fff", fontWeight: "600" },
  empty: { alignItems: "center", marginTop: 40 },
});
