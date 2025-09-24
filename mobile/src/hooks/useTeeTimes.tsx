import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TeeTime } from "../types";

export const useTeeTimes = (groupId: string | null) => {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadTeeTimes = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tee_times")
        .select(
          `
          *,
          weekends!inner(
            id,
            start_date,
            end_date
          ),
          assignments(
            id,
            guest_names,
            profiles(
              id,
              full_name
            )
          )
        `
        )
        .eq("group_id", groupId)
        .order("tee_date", { ascending: true })
        .order("tee_time", { ascending: true });

      if (error) {
        console.error("Error loading tee times:", error);
        setTeeTimes([]);
        return;
      }

      // Transform the data to match our TeeTime type
      const teeTimesWithPlayers =
        data?.map((teeTime) => ({
          ...teeTime,
          players:
            teeTime.assignments?.map((assignment: any) => ({
              ...assignment.profiles,
              guest_names: assignment.guest_names || [],
            })) || [],
          weekends: teeTime.weekends,
        })) || [];

      setTeeTimes(teeTimesWithPlayers);
    } catch (error) {
      console.error("Error loading tee times:", error);
      setTeeTimes([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadTeeTimes();
  }, [loadTeeTimes]);

  return { teeTimes, loading, refresh: loadTeeTimes };
};
