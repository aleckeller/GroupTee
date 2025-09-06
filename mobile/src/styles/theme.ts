// Color palette
export const colors = {
  // Primary colors
  primary: "#0ea5e9",
  primaryDark: "#0284c7",
  primaryLight: "#7dd3fc",

  // Background colors
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceSecondary: "#f1f5f9",

  // Text colors
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",

  // Border colors
  border: "#e2e8f0",
  borderLight: "#f1f5f9",

  // Status colors
  success: "#16a34a",
  successLight: "#f0fdf4",
  warning: "#ea580c",
  warningLight: "#fff7ed",
  error: "#dc2626",
  errorLight: "#fef2f2",
  info: "#0ea5e9",
  infoLight: "#e0f2fe",

  // Role colors
  admin: "#dc2626",
  adminLight: "#fef2f2",
  member: "#059669",
  memberLight: "#f0fdf4",
  guest: "#d97706",
  guestLight: "#fef3c7",
} as const;

// Typography
export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,

  // Font weights
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
} as const;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

// Common styles
export const commonStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    padding: spacing.lg,
  },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  cardLarge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Text styles
  heading: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  subheading: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  body: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },

  bodySecondary: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },

  caption: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },

  // Button styles
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.surface,
  },

  buttonTextSecondary: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },

  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start" as const,
  },

  badgeSuccess: {
    backgroundColor: colors.successLight,
  },

  badgeWarning: {
    backgroundColor: colors.warningLight,
  },

  badgeError: {
    backgroundColor: colors.errorLight,
  },

  badgeInfo: {
    backgroundColor: colors.infoLight,
  },

  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },

  badgeTextSuccess: {
    color: colors.success,
  },

  badgeTextWarning: {
    color: colors.warning,
  },

  badgeTextError: {
    color: colors.error,
  },

  badgeTextInfo: {
    color: colors.info,
  },
} as const;
