import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Interest } from "../types";

export interface InterestWithProfile extends Interest {
  profile: {
    id: string;
    full_name: string;
  };
}

export function useGroupInterests(groupId: string | null) {
  const [interests, setInterests] = useState<InterestWithProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadGroupInterests = useCallback(async () => {
    if (!groupId) {
      setInterests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all interests for members of this group
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
        .eq("wants_to_play", true);

      if (error) {
        console.error("Error loading group interests:", error);
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
      console.error("Error loading group interests:", error);
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupInterests();
  }, [loadGroupInterests]);

  return { interests, loading, refresh: loadGroupInterests };
}
