import { supabase } from "@/lib/supabase";
import { UserService } from "./userService";
import {
  hasReferralBeenTracked,
  markReferralAsTracked,
  ReferralRateLimiter,
  validateReferralData,
} from "@/utils/antiFraud";

export interface ReferralData {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referred_email: string;
  referred_ip?: string;
  referred_cookie?: string;
  is_valid: boolean;
  created_at: string;
}

export interface CreateReferralData {
  referrerId: string;
  referredEmail: string;
  userIp?: string;
  userAgent?: string;
}

/**
 * Referral service for managing referral tracking and validation
 */
export class ReferralService {
  /**
   * Creates a new referral record
   * @param referralData - The referral data to create
   * @returns The created referral record
   */
  static async createReferral(
    referralData: CreateReferralData
  ): Promise<ReferralData> {
    try {
      // Validate referral data
      const validation = validateReferralData(referralData);
      if (!validation.isValid) {
        throw new Error(
          `Invalid referral data: ${validation.reasons.join(", ")}`
        );
      }

      // Check rate limiting
      if (!ReferralRateLimiter.canSubmit(referralData.referrerId)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      // Check if referral already exists
      const existingReferral = await this.getReferralByEmail(
        referralData.referrerId,
        referralData.referredEmail
      );

      if (existingReferral) {
        throw new Error("Referral already exists for this email");
      }

      // Create referral record
      const { data, error } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referralData.referrerId,
          referred_email: referralData.referredEmail.toLowerCase(),
          referred_ip: referralData.userIp,
          referred_cookie: referralData.userAgent, // Using userAgent as cookie for demo
          is_valid: false, // Will be validated when user signs up
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating referral:", error);
        throw new Error("Failed to create referral");
      }

      // Record the submission for rate limiting
      ReferralRateLimiter.recordSubmission(referralData.referrerId);

      return data;
    } catch (error) {
      console.error("Error in createReferral:", error);
      throw error;
    }
  }

  /**
   * Gets a referral by email and referrer
   * @param referrerId - The referrer's user ID
   * @param referredEmail - The referred user's email
   * @returns The referral record or null
   */
  static async getReferralByEmail(
    referrerId: string,
    referredEmail: string
  ): Promise<ReferralData | null> {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", referrerId)
        .eq("referred_email", referredEmail.toLowerCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Error fetching referral:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getReferralByEmail:", error);
      return null;
    }
  }

  /**
   * Validates a referral when a user signs up
   * @param referredEmail - The email of the user who signed up
   * @param referredUserId - The user ID of the person who signed up
   * @returns Success status and referrer info
   */
  static async validateReferralOnSignup(
    referredEmail: string,
    referredUserId: string
  ): Promise<{ success: boolean; referrerId?: string; referrerCode?: string }> {
    try {
      // Find pending referral for this email
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_email", referredEmail.toLowerCase())
        .eq("is_valid", false);

      if (error) {
        console.error("Error fetching referrals for validation:", error);
        return { success: false };
      }

      if (!referrals || referrals.length === 0) {
        return { success: false };
      }

      // Get the most recent referral
      const referral = referrals[0];

      // Validate the referral
      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          is_valid: true,
          referred_id: referredUserId,
        })
        .eq("id", referral.id);

      if (updateError) {
        console.error("Error validating referral:", updateError);
        return { success: false };
      }

      // Associate the user with the referrer
      const referrer = await UserService.getUserByReferralCode(
        referral.referrer_id
      );
      if (referrer) {
        await UserService.associateWithReferrer(
          referredUserId,
          referrer.referral_code
        );
      }

      return {
        success: true,
        referrerId: referral.referrer_id,
        referrerCode: referrer?.referral_code,
      };
    } catch (error) {
      console.error("Error in validateReferralOnSignup:", error);
      return { success: false };
    }
  }

  /**
   * Gets all referrals for a user
   * @param userId - The user ID to get referrals for
   * @returns Array of referral records
   */
  static async getUserReferrals(userId: string): Promise<ReferralData[]> {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user referrals:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserReferrals:", error);
      return [];
    }
  }

  /**
   * Gets valid referrals count for a user
   * @param userId - The user ID to get count for
   * @returns Number of valid referrals
   */
  static async getValidReferralsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", userId)
        .eq("is_valid", true);

      if (error) {
        console.error("Error fetching valid referrals count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getValidReferralsCount:", error);
      return 0;
    }
  }

  /**
   * Gets the leaderboard data
   * @param limit - Number of top users to return (default: 10)
   * @returns Array of leaderboard entries
   */
  static async getLeaderboard(limit: number = 10): Promise<
    Array<{
      id: string;
      username: string;
      referral_code: string;
      total_referrals: number;
      rank: number;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getLeaderboard:", error);
      return [];
    }
  }

  /**
   * Tracks a referral visit (for analytics)
   * @param referralCode - The referral code that was visited
   * @param userIp - The visitor's IP address
   * @param userAgent - The visitor's user agent
   * @returns Success status
   */
  static async trackReferralVisit(
    referralCode: string,
    userIp?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Check if this referral has already been tracked for this visitor
      if (hasReferralBeenTracked(referralCode)) {
        return false; // Already tracked
      }

      // Mark as tracked
      markReferralAsTracked(referralCode);

      // You could store visit analytics here if needed
      // For now, we just return success
      return true;
    } catch (error) {
      console.error("Error tracking referral visit:", error);
      return false;
    }
  }

  /**
   * Gets referral statistics for analytics
   * @param userId - The user ID to get stats for
   * @returns Referral statistics
   */
  static async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    validReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
  }> {
    try {
      const referrals = await this.getUserReferrals(userId);

      const totalReferrals = referrals.length;
      const validReferrals = referrals.filter((r) => r.is_valid).length;
      const pendingReferrals = totalReferrals - validReferrals;
      const conversionRate =
        totalReferrals > 0 ? (validReferrals / totalReferrals) * 100 : 0;

      return {
        totalReferrals,
        validReferrals,
        pendingReferrals,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error("Error in getReferralStats:", error);
      return {
        totalReferrals: 0,
        validReferrals: 0,
        pendingReferrals: 0,
        conversionRate: 0,
      };
    }
  }
}
