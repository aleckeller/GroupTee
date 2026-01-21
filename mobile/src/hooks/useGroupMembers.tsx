import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { GroupMember, RosterMember, Invitation } from "../types";

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupMembers = useCallback(async () => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

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
        (membership: any) => ({
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
  }, [groupId]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  return { members, loading, error, refetch: fetchGroupMembers };
}

// Combined roster hook that includes both real members and pending members (unclaimed invitations)
export function useRoster(groupId: string | null) {
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    if (!groupId) {
      setRoster([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both real members and pending members (unclaimed invitations) in parallel
      const [membersResult, invitationsResult] = await Promise.all([
        supabase
          .from("memberships")
          .select(
            `
            id,
            role,
            profiles!inner(
              id,
              full_name,
              email
            )
          `
          )
          .eq("group_id", groupId),
        supabase
          .from("invitations")
          .select("*")
          .eq("group_id", groupId)
          .eq("invitation_type", "group_member")
          .is("claimed_by", null),
      ]);

      if (membersResult.error) {
        console.error("Error fetching members:", membersResult.error);
        setError(membersResult.error.message);
        return;
      }

      if (invitationsResult.error) {
        console.error("Error fetching invitations:", invitationsResult.error);
        setError(invitationsResult.error.message);
        return;
      }

      // Convert real members to RosterMember format
      const realMembers: RosterMember[] = (membersResult.data || []).map(
        (membership: any) => ({
          id: membership.profiles.id,
          display_name: membership.profiles.full_name || "Unknown",
          role: membership.role as "admin" | "member" | "guest",
          membership_id: membership.id,
          invitation_id: null,
          is_pending: false,
          email: membership.profiles.email || null,
          invite_code: null,
        })
      );

      // Convert unclaimed invitations to RosterMember format (pending members)
      const pendingMembers: RosterMember[] = (
        (invitationsResult.data || []) as Invitation[]
      ).map((invitation) => ({
        id: invitation.id,
        display_name: invitation.display_name || "Unnamed",
        role: invitation.target_role || "member",
        membership_id: null,
        invitation_id: invitation.id,
        is_pending: true,
        email: invitation.invited_email,
        invite_code: invitation.code,
      }));

      // Combine and sort alphabetically
      const combined = [...realMembers, ...pendingMembers].sort((a, b) =>
        a.display_name.localeCompare(b.display_name)
      );

      setRoster(combined);
    } catch (err) {
      console.error("Error in fetchRoster:", err);
      setError("Failed to fetch roster");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  return { roster, loading, error, refetch: fetchRoster };
}
