// User and Authentication Types
export type UserRole = "admin" | "member" | "guest";
export type SystemRole = "sysadmin" | "club_admin" | "group_admin" | "member" | "guest";
export type InvitationType = "club_admin" | "group_member";

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

// Club Types
export type Club = {
  id: string;
  name: string;
  website_url: string | null;
};

// Group Types
export type Group = {
  id: string;
  name: string;
  club_id: string | null;
  club?: Club;
};

export type GroupWithMembership = Group & {
  membership_id: string;
  is_primary: boolean;
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
  guest_names?: string[];
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
  partners: string | null; // Still string in database, but will be JSON array
  guest_count: number | null;
  notes: string | null;
  created_at: string;
};

// Lockout Types
export type LockoutStatus = {
  isLocked: boolean;
  isApproachingLockout: boolean;
  daysUntilLockout: number;
  message: string | null;
  isAssigned?: boolean;
};

// Assignment Types
export type Assignment = {
  id: string;
  weekend_id: string;
  user_id: string | null;
  invitation_id: string | null;
  tee_time_id: string;
  created_at: string;
};

// Unified roster type for displaying mixed members (real + pending)
// Pending members are unclaimed invitations
export type RosterMember = {
  id: string;
  display_name: string;
  role: UserRole;
  membership_id: string | null;  // null for pending (invitation-based)
  invitation_id: string | null;  // set for pending members
  is_pending: boolean;
  email: string | null;
  invite_code: string | null;    // For sharing with pending members
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

// Admin Hierarchy Types
export type Sysadmin = {
  id: string;
  user_id: string;
  created_at: string;
  created_by: string | null;
};

export type ClubAdmin = {
  id: string;
  user_id: string;
  club_id: string;
  created_at: string;
  created_by: string | null;
};

export type Invitation = {
  id: string;
  code: string;
  invitation_type: InvitationType;
  club_id: string | null;
  group_id: string | null;
  target_role: UserRole | null;
  created_by: string;
  claimed_by: string | null;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
  invited_email: string | null;
  display_name: string | null;  // Name for roster display (pending members)
};

export type ClaimInvitationResult = {
  success: boolean;
  error?: string;
  type?: InvitationType;
  club_id?: string;
  group_id?: string;
  role?: UserRole;
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
  InviteUser: { groupId: string; type: InvitationType };
  Account: undefined;
  Notifications: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Interest: undefined;
  Member: undefined;
  Trades: undefined;
  Users: undefined;
  Guest: undefined;
};

export type AdminStackParamList = {
  SysadminDashboard: undefined;
  ClubAdminDashboard: undefined;
  ClubDetail: { clubId: string };
  GroupDetail: { groupId: string };
  InviteUser: { groupId?: string; clubId?: string; type: InvitationType };
  RedeemInvite: undefined;
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
  onDelete?: () => void;
  isAdmin?: boolean;
  currentUserId?: string | null;
};

export type WeekendSectionProps = {
  weekendId: string;
  weekend: Weekend;
  teeTimes: TeeTime[];
  onDeleteTeeTime?: (teeTimeId: string) => void;
};

// Hook Return Types
export type UseAuthReturn = {
  user: any | null; // Supabase User type
  session: any | null; // Supabase Session type
  loading: boolean;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    inviteCode?: string
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
};

export type UseGroupReturn = {
  loading: boolean;
  groups: GroupWithMembership[];
  selectedGroup: GroupWithMembership | null;
  selectGroup: (group: GroupWithMembership | null) => void;
  setPrimaryGroup: (groupId: string) => Promise<void>;
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

export type UseSystemRoleReturn = {
  systemRole: SystemRole;
  isSysadmin: boolean;
  isClubAdmin: boolean;
  clubAdminOf: string[];
  loading: boolean;
};

export type UseClubsReturn = {
  clubs: Club[];
  loading: boolean;
  createClub: (name: string, websiteUrl?: string) => Promise<{ error?: string }>;
  updateClub: (id: string, updates: Partial<Club>) => Promise<{ error?: string }>;
  deleteClub: (id: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
};

export type UseClubGroupsReturn = {
  groups: Group[];
  loading: boolean;
  createGroup: (name: string) => Promise<{ error?: string }>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<{ error?: string }>;
  deleteGroup: (id: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
};

export type UseInvitationsReturn = {
  invitations: Invitation[];
  loading: boolean;
  createInvitation: (
    type: InvitationType,
    targetId: string,
    displayName: string,
    email?: string,
    targetRole?: UserRole
  ) => Promise<{ code?: string; expiresAt?: string; error?: string; invitation?: Invitation }>;
  deleteInvitation: (id: string) => Promise<{ error?: string }>;
  redeemInvitation: (code: string) => Promise<ClaimInvitationResult>;
  sendInviteEmail: (params: {
    email: string;
    inviteCode: string;
    groupName: string;
    inviterName: string;
    displayName?: string;
    expiresAt?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getGroupInvitations: (groupId: string) => Promise<Invitation[]>;
  linkInvitationToUser: (invitationId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  validateInviteCode: (code: string) => Promise<{ valid: boolean; displayName?: string; email?: string; error?: string }>;
  updateInvitationEmail: (invitationId: string, email: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
};

export type UseUserSearchReturn = {
  results: UserProfile[];
  loading: boolean;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
};

export type UseRosterReturn = {
  roster: RosterMember[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};
