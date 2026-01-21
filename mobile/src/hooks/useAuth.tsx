import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserRole, UseAuthReturn } from "../types";

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([{ id: userId }])
            .select()
            .single();

          if (createError) {
            console.error("Error creating user profile:", createError);
            return;
          }

          if (newProfile) {
            setUserProfile({
              id: newProfile.id,
              full_name: newProfile.full_name,
              role: "guest", // Default role for new users
            });
          }
        }
        return;
      }

      if (data) {
        // Determine role from memberships
        let role: UserRole = "guest"; // Default role

        // Check if user has any memberships
        const { data: memberships } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", userId);

        if (memberships && memberships.length > 0) {
          // If user has any admin memberships, they're an admin
          const hasAdminRole = memberships.some((m: { role: string }) => m.role === "admin");
          role = hasAdminRole ? "admin" : "member";
        }

        setUserProfile({
          id: data.id,
          full_name: data.full_name,
          role,
        });
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  // Auto-redeem invite code from user metadata after signup/login
  const redeemPendingInviteCode = useCallback(async (authUser: User) => {
    const inviteCode = authUser.user_metadata?.invite_code;
    if (!inviteCode) return;

    try {
      // Try to redeem the invite code
      const { data, error } = await supabase.rpc("claim_invitation", {
        invite_code: inviteCode,
      });

      if (!error && data?.success) {
        // Clear the invite code from user metadata
        await supabase.auth.updateUser({
          data: { invite_code: null },
        });
      }
    } catch (err) {
      console.error("Error redeeming invite code:", err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await redeemPendingInviteCode(data.session.user);
        await fetchUserProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Only handle SIGNED_IN event - ignore USER_UPDATED to avoid race conditions
          if (event === "SIGNED_IN") {
            await redeemPendingInviteCode(newSession.user);
            await fetchUserProfile(newSession.user.id);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [redeemPendingInviteCode]);

  const value = useMemo<UseAuthReturn>(
    () => ({
      user,
      session,
      loading,
      userProfile,
      refreshProfile,
      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error ? { error: error.message } : {};
      },
      async signUp(email: string, password: string, fullName?: string, inviteCode?: string) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              invite_code: inviteCode,
            },
          },
        });
        if (error) return { error: error.message };
        const needsVerification = !data.session;
        return { needsVerification };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading, userProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
