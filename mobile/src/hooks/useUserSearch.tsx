import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile, UseUserSearchReturn } from "../types";

export function useUserSearch(): UseUserSearchReturn {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string): Promise<void> => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .ilike("normalized_name", `%${query.toLowerCase()}%`)
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        setResults([]);
        return;
      }

      // Map to UserProfile format (role is not available from profiles table directly)
      const profiles: UserProfile[] = (data || []).map((p: { id: string; full_name: string | null }) => ({
        id: p.id,
        full_name: p.full_name,
        role: "guest" as const, // Role determined by memberships, not stored in profiles
      }));

      setResults(profiles);
    } catch (error) {
      console.error("Error in search:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    search,
    clearResults,
  };
}
