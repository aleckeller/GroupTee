import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "../types";

const PAGE_SIZE = 20;

type UseAvailableUsersReturn = {
  users: UserProfile[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadMore: () => void;
  refresh: () => void;
};

export function useAvailableUsers(groupId: string | undefined): UseAvailableUsersReturn {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const fetchUsers = useCallback(
    async (pageNum: number, query: string, append: boolean = false) => {
      if (!groupId) return;

      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        // Get existing member IDs for this group
        const { data: existingMembers } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("group_id", groupId);

        const existingUserIds = (existingMembers || []).map((m) => m.user_id);

        // Build query for available users
        let queryBuilder = supabase
          .from("profiles")
          .select("id, full_name", { count: "exact" })
          .order("full_name", { ascending: true })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        // Exclude existing members
        if (existingUserIds.length > 0) {
          queryBuilder = queryBuilder.not("id", "in", `(${existingUserIds.join(",")})`);
        }

        // Apply search filter if query exists
        if (query.trim().length > 0) {
          queryBuilder = queryBuilder.ilike("normalized_name", `%${query.toLowerCase()}%`);
        }

        const { data, error, count } = await queryBuilder;

        if (error) {
          console.error("Error fetching available users:", error);
          return;
        }

        const profiles: UserProfile[] = (data || []).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          role: "guest" as const,
        }));

        if (append) {
          setUsers((prev) => [...prev, ...profiles]);
        } else {
          setUsers(profiles);
        }

        // Check if there are more pages
        const totalFetched = (pageNum + 1) * PAGE_SIZE;
        setHasMore(count !== null && totalFetched < count);
      } catch (error) {
        console.error("Error in fetchUsers:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [groupId]
  );

  // Initial fetch and when search changes
  useEffect(() => {
    setPage(0);
    fetchUsers(0, searchQuery, false);
  }, [groupId, searchQuery, fetchUsers]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, searchQuery, true);
    }
  }, [loadingMore, hasMore, page, searchQuery, fetchUsers]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchUsers(0, searchQuery, false);
  }, [searchQuery, fetchUsers]);

  return {
    users,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    loadMore,
    refresh,
  };
}
