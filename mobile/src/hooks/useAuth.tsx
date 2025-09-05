import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UserRole = "admin" | "member" | "guest";

type UserProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
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
          const hasAdminRole = memberships.some((m) => m.role === "admin");
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
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("Initial session check:", data.session?.user?.id);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchUserProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event, newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      userProfile,
      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error ? { error: error.message } : {};
      },
      async signUp(email: string, password: string) {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        const needsVerification = !data.session;
        return { needsVerification };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
