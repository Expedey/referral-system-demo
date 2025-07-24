/**
 * Generates a unique referral code for users
 * Uses a combination of letters and numbers for easy sharing
 * @param username - Optional username to include in the code
 * @returns A unique referral code string
 */
export function generateReferralCode(username?: string): string {
  // If username provided, use it as base (sanitized)
  if (username) {
    const sanitizedUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove special characters
      .substring(0, 6); // Limit length

    if (sanitizedUsername.length >= 3) {
      // Add random suffix for uniqueness
      const randomSuffix = Math.random().toString(36).substring(2, 5);
      return `${sanitizedUsername}${randomSuffix}`;
    }
  }

  // Generate random code if no username or username too short
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Validates if a referral code format is correct
 * @param code - The referral code to validate
 * @returns boolean indicating if the code format is valid
 */
export function isValidReferralCode(code: string): boolean {
  // Check if code is alphanumeric and between 6-12 characters
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  return codeRegex.test(code.toUpperCase());
}

/**
 * Generates a secure token for admin invitations
 * Uses crypto.randomUUID() for high entropy
 * @returns A secure token string
 */
export function generateSecureToken(): string {
  // Use crypto.randomUUID() if available (Node.js 14.17+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to Math.random() with timestamp for older environments
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}
