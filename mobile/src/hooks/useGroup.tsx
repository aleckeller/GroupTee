import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { GroupWithMembership, UseGroupReturn } from "../types";

const GroupContext = createContext<UseGroupReturn | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembership | null>(null);

  const loadGroups = useCallback(async () => {
    if (authLoading) return;
    if (!userProfile?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Get memberships with group data and is_primary flag
      const { data } = await supabase
        .from("memberships")
        .select("id, is_primary, groups:group_id(id, name, club_id)")
        .eq("user_id", userProfile.id);

      const mapped: GroupWithMembership[] =
        (data as any[] | null)
          ?.map((row: any) => ({
            ...row.groups,
            membership_id: row.id,
            is_primary: row.is_primary ?? false,
          }))
          .filter((g: any) => g.id) || [];

      // Auto-set primary if user has exactly one group and it's not already primary
      if (mapped.length === 1 && !mapped[0].is_primary) {
        await supabase
          .from("memberships")
          .update({ is_primary: true })
          .eq("id", mapped[0].membership_id);
        mapped[0].is_primary = true;
      }

      setGroups(mapped);
    } finally {
      setLoading(false);
    }
  }, [authLoading, userProfile?.id]);

  // Load groups when auth finishes and userProfile is available
  useEffect(() => {
    if (!authLoading) {
      loadGroups();
    }
  }, [authLoading, userProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep selected group if still present; otherwise clear
  useEffect(() => {
    setSelectedGroup(
      (prev) => prev && (groups.find((g) => g.id === prev.id) ? prev : null)
    );
  }, [groups]);

  const setPrimaryGroup = useCallback(async (groupId: string) => {
    if (!userProfile?.id) return;

    try {
      // First, clear is_primary from all user's memberships
      const { error: clearError } = await supabase
        .from("memberships")
        .update({ is_primary: false })
        .eq("user_id", userProfile.id);

      if (clearError) throw clearError;

      // Then set the new primary group
      const { error: setError } = await supabase
        .from("memberships")
        .update({ is_primary: true })
        .eq("user_id", userProfile.id)
        .eq("group_id", groupId);

      if (setError) throw setError;

      // Update local state immediately for better UX
      setGroups((prevGroups) =>
        prevGroups.map((g) => ({
          ...g,
          is_primary: g.id === groupId,
        }))
      );

      // Also update selected group if it's the one being set as primary
      setSelectedGroup((prev) =>
        prev ? { ...prev, is_primary: prev.id === groupId } : null
      );

    } catch (error: any) {
      Alert.alert("Error", "Failed to set primary group. Please try again.");
      console.error("Error setting primary group:", error);
      // Refresh to get correct state
      await loadGroups();
    }
  }, [userProfile?.id, loadGroups]);

  const value = useMemo<UseGroupReturn>(
    () => ({
      loading,
      groups,
      selectedGroup,
      selectGroup: setSelectedGroup,
      setPrimaryGroup,
      refresh: loadGroups,
    }),
    [loading, groups, selectedGroup, setPrimaryGroup, loadGroups]
  );

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
};

export const useGroup = () => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within GroupProvider");
  return ctx;
};
