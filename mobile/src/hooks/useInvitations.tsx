import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Invitation,
  InvitationType,
  UserRole,
  ClaimInvitationResult,
  UseInvitationsReturn,
} from "../types";
import { useAuth } from "./useAuth";

export function useInvitations(): UseInvitationsReturn {
  const { userProfile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("created_by", userProfile.id)
        .is("claimed_by", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invitations:", error);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error("Error in fetchInvitations:", error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = useCallback(
    async (
      type: InvitationType,
      targetId: string,
      displayName: string,
      email?: string,
      targetRole?: UserRole
    ): Promise<{ code?: string; expiresAt?: string; error?: string; invitation?: Invitation }> => {
      if (!userProfile?.id) {
        return { error: "Not authenticated" };
      }

      try {
        // Generate a unique code
        const { data: codeData, error: codeError } = await supabase.rpc(
          "generate_invite_code"
        );

        if (codeError) {
          return { error: codeError.message };
        }

        const code = codeData as string;
        // Set expiration far in the future (invitations never expire for roster purposes)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100); // 100 years
        const expiresAtStr = expiresAt.toISOString();

        const invitation: Partial<Invitation> = {
          code,
          invitation_type: type,
          created_by: userProfile.id,
          expires_at: expiresAtStr,
          display_name: displayName,
          invited_email: email || null,
        };

        if (type === "club_admin") {
          invitation.club_id = targetId;
        } else {
          invitation.group_id = targetId;
          invitation.target_role = targetRole || "member";
        }

        const { data, error } = await supabase
          .from("invitations")
          .insert([invitation])
          .select()
          .single();

        if (error) {
          return { error: error.message };
        }

        await fetchInvitations();
        return { code, expiresAt: expiresAtStr, invitation: data };
      } catch (error) {
        return { error: "Failed to create invitation" };
      }
    },
    [userProfile?.id, fetchInvitations]
  );

  const deleteInvitation = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase
          .from("invitations")
          .delete()
          .eq("id", id);

        if (error) {
          return { error: error.message };
        }

        await fetchInvitations();
        return {};
      } catch (error) {
        return { error: "Failed to delete invitation" };
      }
    },
    [fetchInvitations]
  );

  const redeemInvitation = useCallback(
    async (code: string): Promise<ClaimInvitationResult> => {
      try {
        const { data, error } = await supabase.rpc("claim_invitation", {
          invite_code: code,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return data as ClaimInvitationResult;
      } catch (error) {
        return { success: false, error: "Failed to redeem invitation" };
      }
    },
    []
  );

  const sendInviteEmail = useCallback(
    async (params: {
      email: string;
      inviteCode: string;
      groupName: string;
      inviterName: string;
      displayName?: string;
      expiresAt?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.functions.invoke("send-invite-email", {
          body: params,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.error) {
          return { success: false, error: data.error };
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: "Failed to send invite email" };
      }
    },
    []
  );

  const getGroupInvitations = useCallback(
    async (groupId: string): Promise<Invitation[]> => {
      try {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("group_id", groupId)
          .eq("invitation_type", "group_member")
          .is("claimed_by", null)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching group invitations:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Error in getGroupInvitations:", error);
        return [];
      }
    },
    []
  );

  const linkInvitationToUser = useCallback(
    async (invitationId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.rpc("link_invitation_to_user", {
          invite_id: invitationId,
          target_user_id: userId,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const result = data as { success: boolean; error?: string };

        if (result.success) {
          await fetchInvitations();
        }

        return result;
      } catch (error) {
        return { success: false, error: "Failed to link invitation to user" };
      }
    },
    [fetchInvitations]
  );

  const validateInviteCode = useCallback(
    async (
      code: string
    ): Promise<{
      valid: boolean;
      displayName?: string;
      email?: string;
      error?: string;
    }> => {
      try {
        const { data, error } = await supabase.rpc("validate_invite_code", {
          invite_code: code,
        });

        if (error) {
          return { valid: false, error: error.message };
        }

        const result = data as { valid: boolean; display_name?: string; invited_email?: string; error?: string };

        if (!result.valid) {
          return { valid: false, error: result.error || "Invalid invite code" };
        }

        return {
          valid: true,
          displayName: result.display_name || undefined,
          email: result.invited_email || undefined,
        };
      } catch (error) {
        return { valid: false, error: "Failed to validate invite code" };
      }
    },
    []
  );

  const updateInvitationEmail = useCallback(
    async (
      invitationId: string,
      email: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("invitations")
          .update({ invited_email: email })
          .eq("id", invitationId)
          .is("claimed_by", null);

        if (error) {
          return { success: false, error: error.message };
        }

        await fetchInvitations();
        return { success: true };
      } catch (error) {
        return { success: false, error: "Failed to update invitation email" };
      }
    },
    [fetchInvitations]
  );

  return {
    invitations,
    loading,
    createInvitation,
    deleteInvitation,
    redeemInvitation,
    sendInviteEmail,
    getGroupInvitations,
    linkInvitationToUser,
    validateInviteCode,
    updateInvitationEmail,
    refresh: fetchInvitations,
  };
}
