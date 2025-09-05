import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TeeTime } from "@/utils/teeTimeUtils";

export const useTeeTimes = (groupId: string | null) => {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadTeeTimes = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tee_times")
        .select(
          `
          *,
          weekends(
            id,
            name,
            start_date,
            end_date
          ),
          assignments(
            profiles(
              id,
              full_name
            )
          )
        `
        )
        .eq("group_id", groupId)
        .order("weekends(start_date)", { ascending: true })
        .order("tee_date", { ascending: true })
        .order("tee_time", { ascending: true });

      if (error) {
        console.error("Error loading tee times:", error);
        return;
      }

      // Transform the data to match our TeeTime type
      const teeTimesWithPlayers =
        data?.map((teeTime) => ({
          ...teeTime,
          players:
            teeTime.assignments?.map(
              (assignment: any) => assignment.profiles
            ) || [],
          weekends: teeTime.weekends,
        })) || [];

      setTeeTimes(teeTimesWithPlayers);
    } catch (error) {
      console.error("Error loading tee times:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeeTimes();
  }, [groupId]);

  return { teeTimes, loading, refresh: loadTeeTimes };
};
