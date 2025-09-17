// User and Authentication Types
export type UserRole = "admin" | "member" | "guest";

export type UserProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

export type User = {
  id: string;
  full_name: string | null;
  role: UserRole;
  membership_id: string;
};

// Group Types
export type Group = {
  id: string;
  name: string;
};

export type GroupMember = {
  id: string;
  full_name: string | null;
  role: UserRole;
  membership_id: string;
};

// Weekend Types
export type Weekend = {
  id: string;
  start_date: string;
  end_date: string;
};

// Tee Time Types
export type Player = {
  id: string;
  full_name: string;
};

export type TeeTime = {
  id: string;
  tee_date: string;
  tee_time: string;
  weekend_id: string;
  group_id: string;
  max_players: number;
  created_at: string;
  players?: Player[];
  weekends: Weekend;
};

// Interest Types
export type Interest = {
  id: string;
  user_id: string;
  interest_date: string;
  wants_to_play: boolean | null;
  time_preference: string | null;
  transportation: string | null;
  partners: string | null;
  notes: string | null;
  created_at: string;
};

// Lockout Types
export type LockoutStatus = {
  isLocked: boolean;
  isApproachingLockout: boolean;
  daysUntilLockout: number;
  message: string | null;
};

// Assignment Types
export type Assignment = {
  id: string;
  weekend_id: string;
  user_id: string;
  tee_time_id: string;
  created_at: string;
};

// Trade Types
export type TradeStatus = "pending" | "accepted" | "rejected";

export type Trade = {
  id: string;
  weekend_id: string;
  from_group_id: string;
  to_group_id: string;
  from_tee_time_id: string;
  to_tee_time_id: string;
  initiated_by: string;
  status: TradeStatus;
  created_at: string;
};

// Notification Types
export type Notification = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
};

// Stats Types
export type Stat = {
  id: string;
  label: string;
  value: number;
};

// API Response Types
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  loading?: boolean;
};

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  TeeTimeAssignment: { teeTime: TeeTime };
};

export type TabParamList = {
  Dashboard: undefined;
  Interest: undefined;
  Member: undefined;
  Trades: undefined;
  Users: undefined;
  Guest: undefined;
};

// Component Props Types
export type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export type StatsCardProps = {
  stats: Stat[];
  loading: boolean;
};

export type TeeTimeCardProps = {
  teeTime: TeeTime;
  onPress?: () => void;
  currentUserId?: string | null;
};

export type WeekendSectionProps = {
  weekendId: string;
  weekend: Weekend;
  teeTimes: TeeTime[];
};

// Hook Return Types
export type UseAuthReturn = {
  user: any | null; // Supabase User type
  session: any | null; // Supabase Session type
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
};

export type UseGroupReturn = {
  loading: boolean;
  groups: Group[];
  selectedGroup: Group | null;
  selectGroup: (group: Group | null) => void;
  refresh: () => Promise<void>;
};

export type UseGroupMembersReturn = {
  members: GroupMember[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export type UseTeeTimesReturn = {
  teeTimes: TeeTime[];
  loading: boolean;
  refresh: () => void;
};

export type UseWeekendsReturn = {
  weekends: Weekend[];
  loading: boolean;
  refresh: () => void;
};

export type UseStatsReturn = {
  stats: Stat[];
  loading: boolean;
  refresh: () => void;
};
