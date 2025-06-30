/**
 * Anti-fraud utilities to prevent referral abuse
 * Includes IP tracking, cookie-based deduplication, and rate limiting
 */

/**
 * Generates a unique fingerprint for the current user/browser
 * Combines multiple factors to create a semi-unique identifier
 * @returns A fingerprint string
 */
export function generateUserFingerprint(): string {
  if (typeof window === "undefined") return "server-side";

  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    // Add more factors as needed
  ];

  // Simple hash function
  const hash = factors
    .join("|")
    .split("")
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

  return Math.abs(hash).toString(36);
}

/**
 * Creates a unique cookie for tracking referrals
 * @param referralCode - The referral code being tracked
 * @returns A unique cookie identifier
 */
export function createReferralCookie(referralCode: string): string {
  const fingerprint = generateUserFingerprint();
  const timestamp = Date.now().toString(36);
  return `ref_${referralCode}_${fingerprint}_${timestamp}`;
}

/**
 * Checks if a referral has already been tracked for this user
 * @param referralCode - The referral code to check
 * @returns True if referral already exists, false otherwise
 */
export function hasReferralBeenTracked(referralCode: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const cookies = document.cookie.split(";");
    const refPrefix = `ref_${referralCode}_`;

    return cookies.some((cookie) => {
      const [name] = cookie.trim().split("=");
      return name.startsWith(refPrefix);
    });
  } catch (error) {
    console.error("Error checking referral tracking:", error);
    return false;
  }
}

/**
 * Marks a referral as tracked by setting a cookie
 * @param referralCode - The referral code to mark as tracked
 * @param expiresInDays - Number of days until cookie expires (default: 30)
 */
export function markReferralAsTracked(
  referralCode: string,
  expiresInDays: number = 30
): void {
  if (typeof window === "undefined") return;

  try {
    const cookieName = createReferralCookie(referralCode);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    document.cookie = `${cookieName}=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error("Error marking referral as tracked:", error);
  }
}

/**
 * Rate limiting utility for referral submissions
 * Prevents users from submitting multiple referrals too quickly
 */
export class ReferralRateLimiter {
  private static submissions = new Map<string, number[]>();
  private static readonly MAX_SUBMISSIONS = 15; // Max submissions per window
  private static readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour window

  /**
   * Checks if a user can submit a referral
   * @param userId - The user ID to check
   * @returns True if user can submit, false if rate limited
   */
  static canSubmit(userId: string): boolean {
    const now = Date.now();
    const userSubmissions = this.submissions.get(userId) || [];

    // Remove old submissions outside the window
    const recentSubmissions = userSubmissions.filter(
      (timestamp) => now - timestamp < this.WINDOW_MS
    );

    // Update the map
    this.submissions.set(userId, recentSubmissions);

    return recentSubmissions.length < this.MAX_SUBMISSIONS;
  }

  /**
   * Records a referral submission
   * @param userId - The user ID who submitted
   */
  static recordSubmission(userId: string): void {
    const now = Date.now();
    const userSubmissions = this.submissions.get(userId) || [];
    userSubmissions.push(now);
    this.submissions.set(userId, userSubmissions);
  }

  /**
   * Gets the remaining submissions allowed for a user
   * @param userId - The user ID to check
   * @returns Number of remaining submissions
   */
  static getRemainingSubmissions(userId: string): number {
    const now = Date.now();
    const userSubmissions = this.submissions.get(userId) || [];
    const recentSubmissions = userSubmissions.filter(
      (timestamp) => now - timestamp < this.WINDOW_MS
    );

    return Math.max(0, this.MAX_SUBMISSIONS - recentSubmissions.length);
  }
}

/**
 * Validates referral data for potential fraud
 * @param referralData - The referral data to validate
 * @returns Object with validation results
 */
export function validateReferralData(referralData: {
  referrerId: string;
  referredEmail: string;
  userIp?: string;
  userAgent?: string;
}): {
  isValid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check for self-referral
  if (referralData.referrerId === referralData.referredEmail) {
    reasons.push("Self-referral detected");
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(referralData.referredEmail)) {
    reasons.push("Invalid email format");
  }

  // Check for suspicious patterns (basic checks)
  if (
    referralData.referredEmail.includes("test") ||
    referralData.referredEmail.includes("temp") ||
    referralData.referredEmail.includes("fake")
  ) {
    reasons.push("Suspicious email pattern detected");
  }

  // Check user agent for bots
  if (
    referralData.userAgent &&
    (referralData.userAgent.includes("bot") ||
      referralData.userAgent.includes("crawler") ||
      referralData.userAgent.includes("spider"))
  ) {
    reasons.push("Bot user agent detected");
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}
