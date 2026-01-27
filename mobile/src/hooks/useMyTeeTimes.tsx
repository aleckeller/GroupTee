import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { TeeTime } from "../types";

export const useMyTeeTimes = (userId: string | null) => {
  const [myTeeTimes, setMyTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const hasLoadedRef = useRef(false);

  const loadMyTeeTimes = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          tee_times!inner(
            id,
            tee_date,
            tee_time,
            max_players,
            created_at,
            weekend_id,
            weekends(id, start_date, end_date),
            assignments(
              user_id,
              invitation_id,
              guest_names,
              profiles(id, full_name),
              invitations(id, display_name)
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("tee_times(tee_date)", { ascending: true })
        .order("tee_times(tee_time)", { ascending: true });

      if (error) {
        console.error("Error loading my tee times:", error);
        setMyTeeTimes([]);
        return;
      }

      // Transform the data to match our TeeTime type
      const transformedTeeTimes =
        data?.map((assignment: any) => {
          const teeTime = assignment.tee_times;
          return {
            id: teeTime.id,
            tee_date: teeTime.tee_date,
            tee_time: teeTime.tee_time,
            weekend_id: teeTime.weekend_id,
            group_id: "", // Not needed for user's view
            max_players: teeTime.max_players,
            created_at: teeTime.created_at,
            players:
              teeTime.assignments?.map((a: any) => {
                // Check if this is a pending member (invitation) or a regular user
                if (a.invitation_id && !a.user_id) {
                  // Pending member - use invitation data
                  return {
                    id: a.invitation_id,
                    full_name: a.invitations?.display_name || "Pending Member",
                    guest_names: a.guest_names || [],
                    is_pending: true,
                  };
                }
                // Regular user - use profile data
                return {
                  ...a.profiles,
                  guest_names: a.guest_names || [],
                  is_pending: false,
                };
              }) || [],
            weekends: teeTime.weekends,
          };
        }) || [];

      setMyTeeTimes(transformedTeeTimes);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading my tee times:", error);
      setMyTeeTimes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMyTeeTimes();
  }, [loadMyTeeTimes]);

  return { myTeeTimes, loading, refresh: loadMyTeeTimes };
};
