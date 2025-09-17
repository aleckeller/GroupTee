// Configuration for tee time preference lockout
export const LOCKOUT_CONFIG = {
  // Number of days before tee time when preferences become locked
  LOCKOUT_DAYS: 2,

  // Whether to show a warning message when approaching lockout
  SHOW_WARNING: true,

  // Number of days before lockout to show warning
  WARNING_DAYS: 5,
} as const;

// Utility function to check if a date is locked
export function isDateLocked(
  teeDate: string,
  lockoutDays: number = LOCKOUT_CONFIG.LOCKOUT_DAYS
): boolean {
  const today = new Date();
  // Parse the target date in local timezone to avoid UTC issues
  const [year, month, day] = teeDate.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day); // month is 0-indexed

  // Set both dates to start of day for accurate day comparison
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  // Calculate the difference in days
  const timeDiff = targetStart.getTime() - todayStart.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  return daysDiff <= lockoutDays;
}

// Utility function to check if a date is approaching lockout (for warnings)
export function isDateApproachingLockout(
  teeDate: string,
  warningDays: number = LOCKOUT_CONFIG.WARNING_DAYS
): boolean {
  const today = new Date();
  // Parse the target date in local timezone to avoid UTC issues
  const [year, month, day] = teeDate.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day); // month is 0-indexed

  // Set both dates to start of day for accurate day comparison
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  // Calculate the difference in days
  const timeDiff = targetStart.getTime() - todayStart.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  return daysDiff <= warningDays && daysDiff > LOCKOUT_CONFIG.LOCKOUT_DAYS;
}

// Utility function to get days until lockout
export function getDaysUntilLockout(
  teeDate: string,
  lockoutDays: number = LOCKOUT_CONFIG.LOCKOUT_DAYS
): number {
  const today = new Date();
  // Parse the target date in local timezone to avoid UTC issues
  const [year, month, day] = teeDate.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day); // month is 0-indexed

  // Set both dates to start of day for accurate day comparison
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  // Calculate the difference in days
  const timeDiff = targetStart.getTime() - todayStart.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  return Math.max(0, daysDiff - lockoutDays);
}

// Utility function to get lockout status message
export function getLockoutStatusMessage(teeDate: string): string | null {
  if (isDateLocked(teeDate)) {
    return `Preferences are locked for this date (within ${LOCKOUT_CONFIG.LOCKOUT_DAYS} days of tee time)`;
  }

  if (isDateApproachingLockout(teeDate)) {
    const daysLeft = getDaysUntilLockout(teeDate);
    return `Preferences will be locked in ${daysLeft} day${
      daysLeft !== 1 ? "s" : ""
    }`;
  }

  return null;
}
