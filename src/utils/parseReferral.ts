/**
 * Parses referral code from URL parameters
 * Supports both query params (?ref=code) and path params (/ref/code)
 * @param url - The URL to parse
 * @returns The referral code if found, null otherwise
 */
export function parseReferralFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check query parameter first (?ref=code)
    const refParam = urlObj.searchParams.get("ref");
    if (refParam) {
      return refParam.toUpperCase();
    }

    // Check path parameter (/ref/code)
    const pathParts = urlObj.pathname.split("/");
    const refIndex = pathParts.findIndex((part) => part === "ref");
    if (refIndex !== -1 && pathParts[refIndex + 1]) {
      return pathParts[refIndex + 1].toUpperCase();
    }

    return null;
  } catch (error) {
    console.error("Error parsing referral from URL:", error);
    return null;
  }
}

/**
 * Creates a referral URL for sharing
 * @param baseUrl - The base URL of your application
 * @param referralCode - The referral code to include
 * @param usePath - Whether to use path format (/ref/code) instead of query (?ref=code)
 * @returns The complete referral URL
 */
export function createReferralUrl(
  baseUrl: string,
  referralCode: string,
  usePath: boolean = true
): string {
  if (usePath) {
    return `${baseUrl}/ref/${referralCode}`;
  } else {
    return `${baseUrl}?ref=${referralCode}`;
  }
}

/**
 * Extracts referral code from current browser URL
 * @returns The referral code if found, null otherwise
 */
export function getReferralFromCurrentUrl(): string | null {
  if (typeof window === "undefined") return null;
  return parseReferralFromUrl(window.location.href);
}

/**
 * Stores referral code in localStorage for later use
 * @param referralCode - The referral code to store
 */
export function storeReferralCode(referralCode: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("referral_code", referralCode);
    // Set expiration (24 hours)
    localStorage.setItem(
      "referral_code_expires",
      (Date.now() + 24 * 60 * 60 * 1000).toString()
    );
  } catch (error) {
    console.error("Error storing referral code:", error);
  }
}

/**
 * Retrieves stored referral code from localStorage
 * @returns The stored referral code if valid, null otherwise
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const code = localStorage.getItem("referral_code");
    const expires = localStorage.getItem("referral_code_expires");

    if (!code || !expires) return null;

    // Check if expired
    if (Date.now() > parseInt(expires)) {
      localStorage.removeItem("referral_code");
      localStorage.removeItem("referral_code_expires");
      return null;
    }

    return code;
  } catch (error) {
    console.error("Error retrieving referral code:", error);
    return null;
  }
}

/**
 * Clears stored referral code from localStorage
 */
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("referral_code");
    localStorage.removeItem("referral_code_expires");
  } catch (error) {
    console.error("Error clearing referral code:", error);
  }
}
