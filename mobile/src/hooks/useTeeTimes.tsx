import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TeeTime } from "../types";
import { Alert } from "react-native";

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
            user_id,
            invitation_id,
            guest_names,
            profiles(
              id,
              full_name
            ),
            invitations(
              id,
              display_name
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

      // Define the assignment type for proper typing
      type AssignmentData = {
        id: string;
        user_id: string | null;
        invitation_id: string | null;
        guest_names: string[] | null;
        profiles: { id: string; full_name: string } | null;
        invitations: { id: string; display_name: string | null } | null;
      };

      // Transform the data to match our TeeTime type
      const teeTimesWithPlayers =
        data?.map((teeTime: TeeTime & { assignments?: AssignmentData[] }) => ({
          ...teeTime,
          players:
            teeTime.assignments?.map((assignment: AssignmentData) => {
              // Check if this is a pending member (invitation) or a regular user
              if (assignment.invitation_id && !assignment.user_id) {
                // Pending member - use invitation data
                return {
                  id: assignment.invitation_id,
                  full_name: assignment.invitations?.display_name || "Pending Member",
                  guest_names: assignment.guest_names || [],
                  is_pending: true,
                };
              }
              // Regular user - use profile data
              return {
                id: assignment.profiles?.id || assignment.user_id || "",
                full_name: assignment.profiles?.full_name || "Unknown",
                guest_names: assignment.guest_names || [],
                is_pending: false,
              };
            }) || [],
          weekends: teeTime.weekends,
        })) || [];

      setTeeTimes(teeTimesWithPlayers as TeeTime[]);
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

  const deleteTeeTime = useCallback(
    async (teeTimeId: string) => {
      try {
        const { error } = await supabase
          .from("tee_times")
          .delete()
          .eq("id", teeTimeId);

        if (error) {
          console.error("Error deleting tee time:", error);
          Alert.alert("Error", "Failed to delete tee time");
          return false;
        }

        // Update local state
        setTeeTimes((prev) => prev.filter((t) => t.id !== teeTimeId));
        return true;
      } catch (error) {
        console.error("Error deleting tee time:", error);
        Alert.alert("Error", "Failed to delete tee time");
        return false;
      }
    },
    []
  );

  return { teeTimes, loading, refresh: loadTeeTimes, deleteTeeTime };
};
