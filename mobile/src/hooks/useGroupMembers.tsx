import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GroupMember } from "../types";

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    fetchGroupMembers();
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("memberships")
        .select(
          `
          id,
          role,
          profiles!inner(
            id,
            full_name
          )
        `
        )
        .eq("group_id", groupId)
        .order("profiles(full_name)", { ascending: true });

      if (error) {
        console.error("Error fetching group members:", error);
        setError(error.message);
        return;
      }

      const formattedMembers: GroupMember[] = (data || []).map(
        (membership) => ({
          id: membership.profiles.id,
          full_name: membership.profiles.full_name,
          role: membership.role as "admin" | "member" | "guest",
          membership_id: membership.id,
        })
      );

      setMembers(formattedMembers);
    } catch (err) {
      console.error("Error in fetchGroupMembers:", err);
      setError("Failed to fetch group members");
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, error, refetch: fetchGroupMembers };
}
