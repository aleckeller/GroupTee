import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Group, UseGroupReturn } from "../types";

const GroupContext = createContext<UseGroupReturn | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const loadGroups = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      if (userProfile?.id) {
        // Only show groups where user has a membership (any role)
        const { data } = await supabase
          .from("memberships")
          .select("groups:group_id(id,name)")
          .eq("user_id", userProfile.id);
        const mapped: Group[] =
          (data as any[] | null)
            ?.map((row: any) => row.groups)
            .filter(Boolean) || [];
        setGroups(mapped);
      } else {
        setGroups([]);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, userProfile?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Keep selected group if still present; otherwise clear
  useEffect(() => {
    setSelectedGroup(
      (prev) => prev && (groups.find((g) => g.id === prev.id) ? prev : null)
    );
  }, [groups]);

  const value = useMemo<UseGroupReturn>(
    () => ({
      loading,
      groups,
      selectedGroup,
      selectGroup: setSelectedGroup,
      refresh: loadGroups,
    }),
    [loading, groups, selectedGroup, loadGroups]
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
