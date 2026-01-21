import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Group, UseClubGroupsReturn } from "../types";

export function useClubGroups(clubId: string | null): UseClubGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!clubId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, club_id")
        .eq("club_id", clubId)
        .order("name");

      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }

      setGroups(data || []);
    } catch (error) {
      console.error("Error in fetchGroups:", error);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(
    async (name: string): Promise<{ error?: string }> => {
      if (!clubId) {
        return { error: "No club selected" };
      }

      try {
        const { error } = await supabase.from("groups").insert([
          {
            name,
            club_id: clubId,
          },
        ]);

        if (error) {
          return { error: error.message };
        }

        await fetchGroups();
        return {};
      } catch (error) {
        return { error: "Failed to create group" };
      }
    },
    [clubId, fetchGroups]
  );

  const updateGroup = useCallback(
    async (
      id: string,
      updates: Partial<Group>
    ): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase
          .from("groups")
          .update(updates)
          .eq("id", id);

        if (error) {
          return { error: error.message };
        }

        await fetchGroups();
        return {};
      } catch (error) {
        return { error: "Failed to update group" };
      }
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.from("groups").delete().eq("id", id);

        if (error) {
          return { error: error.message };
        }

        await fetchGroups();
        return {};
      } catch (error) {
        return { error: "Failed to delete group" };
      }
    },
    [fetchGroups]
  );

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refresh: fetchGroups,
  };
}
