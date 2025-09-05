import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Stat = {
  id: string;
  label: string;
  value: number;
};

export const useStats = (groupId: string | null) => {
  const [stats, setStats] = useState<Stat[]>([
    { id: "s1", label: "Players", value: 0 },
    { id: "s2", label: "Tee Times", value: 0 },
    { id: "s3", label: "Trades", value: 0 },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadStats = async () => {
    if (!groupId) return;

    setLoading(true);
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
          .eq("group_id", groupId),
        // Count tee times for this group
        supabase
          .from("tee_times")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId),
        // Count trades involving members of this group
        supabase
          .from("trades")
          .select("*", { count: "exact", head: true })
          .or(`from_group_id.eq.${groupId},to_group_id.eq.${groupId}`),
      ]);

      setStats([
        { id: "s1", label: "Players", value: playersCount || 0 },
        { id: "s2", label: "Tee Times", value: teeTimesCount || 0 },
        { id: "s3", label: "Trades", value: tradesCount || 0 },
      ]);
    } catch (_e) {
      // Keep defaults if error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [groupId]);

  return { stats, loading, refresh: loadStats };
};
