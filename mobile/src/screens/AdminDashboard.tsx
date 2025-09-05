import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/RoleGuard";

type TeeTime = {
  id: string;
  tee_date: string;
  tee_time: string;
  weekend_id: string;
  group_id: string;
  created_at: string;
  weekends?: {
    name: string;
    start_date: string;
    end_date: string;
  };
};

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const { selectedGroup } = useGroup();
  const [stats, setStats] = useState([
    { id: "s1", label: "Players", value: 0 },
    { id: "s2", label: "Tee Times", value: 0 },
    { id: "s3", label: "Trades", value: 0 },
  ]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [teeTimesLoading, setTeeTimesLoading] = useState<boolean>(false);

  const loadStats = async () => {
    if (!selectedGroup) return;

    setStatsLoading(true);
    try {
      const [
        { count: playersCount },
        { count: teeTimesCount },
        { count: tradesCount },
      ] = await Promise.all([
        // Count members in the selected group
        supabase
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("group_id", selectedGroup.id),
        // Count tee times for this group
        supabase
          .from("tee_times")
          .select("*", { count: "exact", head: true })
          .eq("group_id", selectedGroup.id),
        // Count trades involving members of this group
        supabase
          .from("trades")
          .select("*", { count: "exact", head: true })
          .or(
            `from_group_id.eq.${selectedGroup.id},to_group_id.eq.${selectedGroup.id}`
          ),
      ]);

      setStats([
        { id: "s1", label: "Players", value: playersCount || 0 },
        { id: "s2", label: "Tee Times", value: teeTimesCount || 0 },
        { id: "s3", label: "Trades", value: tradesCount || 0 },
      ]);
    } catch (_e) {
      // Keep defaults if error
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTeeTimes = async () => {
    if (!selectedGroup) return;

    setTeeTimesLoading(true);
    try {
      const { data, error } = await supabase
        .from("tee_times")
        .select(
          `
          *,
          weekends (
            name,
            start_date,
            end_date
          )
        `
        )
        .eq("group_id", selectedGroup.id)
        .order("tee_date", { ascending: true })
        .order("tee_time", { ascending: true });

      if (error) {
        console.error("Error loading tee times:", error);
        return;
      }

      setTeeTimes(data || []);
    } catch (error) {
      console.error("Error loading tee times:", error);
    } finally {
      setTeeTimesLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTeeTimes();
  }, [selectedGroup]);

  const formatTime = (timeString: string) => {
    // Convert "08:00:00" to "8:00 AM"
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    // Convert "2024-04-20" to "Saturday, April 20"
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const groupTeeTimesByDate = (teeTimes: TeeTime[]) => {
    const grouped: { [key: string]: TeeTime[] } = {};

    teeTimes.forEach((teeTime) => {
      const dateKey = teeTime.tee_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(teeTime);
    });

    return grouped;
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.header}>Admin Dashboard</Text>

        {userProfile && (
          <View style={styles.roleIndicator}>
            {userProfile.full_name && (
              <Text style={styles.nameText}>
                Welcome, {userProfile.full_name}
              </Text>
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.id} style={styles.statCard}>
              <Text style={styles.statValue}>
                {statsLoading ? "…" : s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <Text>No new notifications</Text>
        </View>

        <Text style={styles.sectionTitle}>Tee Times</Text>
        {teeTimesLoading ? (
          <View style={styles.card}>
            <Text>Loading tee times...</Text>
          </View>
        ) : teeTimes.length === 0 ? (
          <View style={styles.card}>
            <Text>No tee times found for this group</Text>
          </View>
        ) : (
          <View>
            {Object.entries(groupTeeTimesByDate(teeTimes)).map(
              ([date, dayTeeTimes]) => (
                <View key={date} style={styles.dateSection}>
                  <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                  {dayTeeTimes.map((teeTime) => (
                    <View key={teeTime.id} style={styles.teeItem}>
                      <Text style={styles.teeTime}>
                        {formatTime(teeTime.tee_time)}
                      </Text>
                      <Text style={styles.badge}>
                        {teeTime.weekends?.name || "Weekend"}
                      </Text>
                      <Text style={styles.badgeMuted}>
                        Group {selectedGroup?.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: { padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#64748b" },
  sectionTitle: { fontWeight: "600", marginTop: 8, marginBottom: 6 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  teeItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teeTime: { fontWeight: "700", marginRight: 6 },
  badge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    color: "#1d4ed8",
  },
  badgeMuted: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    color: "#334155",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  mono: { marginTop: 8, fontFamily: "Courier", color: "#334155" },
  roleIndicator: {
    backgroundColor: "#e0f2fe",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  dateSection: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
