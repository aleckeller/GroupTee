import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { SystemRole, UseSystemRoleReturn } from "../types";

export function useSystemRole(): UseSystemRoleReturn {
  const { userProfile } = useAuth();
  const [isSysadmin, setIsSysadmin] = useState(false);
  const [clubAdminOf, setClubAdminOf] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Check sysadmin status
      const { data: sysadminData } = await supabase
        .from("sysadmins")
        .select("id")
        .eq("user_id", userProfile.id)
        .maybeSingle();

      // Get club admin associations
      const { data: clubAdminData } = await supabase
        .from("club_admins")
        .select("club_id")
        .eq("user_id", userProfile.id);

      setIsSysadmin(!!sysadminData);
      setClubAdminOf(clubAdminData?.map((ca) => ca.club_id) || []);
    } catch (error) {
      console.error("Error fetching system roles:", error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Determine the highest system role
  const systemRole: SystemRole = isSysadmin
    ? "sysadmin"
    : clubAdminOf.length > 0
      ? "club_admin"
      : userProfile?.role === "admin"
        ? "group_admin"
        : userProfile?.role || "guest";

  return {
    systemRole,
    isSysadmin,
    isClubAdmin: clubAdminOf.length > 0,
    clubAdminOf,
    loading,
  };
}
