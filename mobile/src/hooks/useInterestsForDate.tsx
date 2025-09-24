import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Interest } from "../types";

export interface InterestWithProfile extends Interest {
  profile: {
    id: string;
    full_name: string;
  };
}

export function useInterestsForDate(
  date: string | null,
  groupId: string | null
) {
  const [interests, setInterests] = useState<InterestWithProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadInterestsForDate = useCallback(async () => {
    if (!date || !groupId) {
      setInterests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interests")
        .select(
          `
          *,
          profile:profiles!interests_user_id_fkey(
            id,
            full_name
          )
        `
        )
        .eq("interest_date", date)
        .eq("wants_to_play", true);

      if (error) {
        console.error("Error loading interests for date:", error);
        setInterests([]);
        return;
      }

      // Filter to only include members of the current group
      const groupMembers = await supabase
        .from("memberships")
        .select("user_id")
        .eq("group_id", groupId);

      if (groupMembers.error) {
        console.error("Error loading group members:", groupMembers.error);
        setInterests([]);
        return;
      }

      const memberIds = new Set(groupMembers.data?.map((m) => m.user_id) || []);
      const filteredInterests =
        data?.filter((interest) => memberIds.has(interest.user_id)) || [];

      setInterests(filteredInterests);
    } catch (error) {
      console.error("Error loading interests for date:", error);
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, [date, groupId]);

  useEffect(() => {
    loadInterestsForDate();
  }, [loadInterestsForDate]);

  return { interests, loading, refresh: loadInterestsForDate };
}
