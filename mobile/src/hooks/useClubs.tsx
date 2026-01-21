import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Club, UseClubsReturn } from "../types";
import { useSystemRole } from "./useSystemRole";

export function useClubs(): UseClubsReturn {
  const { isSysadmin, clubAdminOf } = useSystemRole();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("clubs").select("id, name, website_url");

      // Sysadmins see all clubs, club admins see only their clubs
      if (!isSysadmin && clubAdminOf.length > 0) {
        query = query.in("id", clubAdminOf);
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.error("Error fetching clubs:", error);
        return;
      }

      setClubs(data || []);
    } catch (error) {
      console.error("Error in fetchClubs:", error);
    } finally {
      setLoading(false);
    }
  }, [isSysadmin, clubAdminOf]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const createClub = useCallback(
    async (
      name: string,
      websiteUrl?: string
    ): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.from("clubs").insert([
          {
            name,
            website_url: websiteUrl || null,
          },
        ]);

        if (error) {
          return { error: error.message };
        }

        await fetchClubs();
        return {};
      } catch (error) {
        return { error: "Failed to create club" };
      }
    },
    [fetchClubs]
  );

  const updateClub = useCallback(
    async (
      id: string,
      updates: Partial<Club>
    ): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase
          .from("clubs")
          .update(updates)
          .eq("id", id);

        if (error) {
          return { error: error.message };
        }

        await fetchClubs();
        return {};
      } catch (error) {
        return { error: "Failed to update club" };
      }
    },
    [fetchClubs]
  );

  const deleteClub = useCallback(
    async (id: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.from("clubs").delete().eq("id", id);

        if (error) {
          return { error: error.message };
        }

        await fetchClubs();
        return {};
      } catch (error) {
        return { error: "Failed to delete club" };
      }
    },
    [fetchClubs]
  );

  return {
    clubs,
    loading,
    createClub,
    updateClub,
    deleteClub,
    refresh: fetchClubs,
  };
}
