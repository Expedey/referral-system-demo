import { supabase } from "@/lib/supabase";
import { UserService } from "./userService";
import {
  hasReferralBeenTracked,
  markReferralAsTracked,
  ReferralRateLimiter,
  validateReferralData,
} from "@/utils/antiFraud";
import { checkIPThrottle, recordIPAttempt } from "@/utils/ipThrottling";

export interface ReferralData {
  id: string;
  referrer_id: string;
  referred_user_id?: string;
  referred_email: string;
  referred_ip?: string;
  status: 'pending' | 'verified' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateReferralData {
  referrerId: string;
  referredEmail: string;
  referredUserId?: string;
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

      // Basic IP throttling check
      if (referralData.userIp) {
        console.log(`[ReferralService] IP tracking: ${referralData.userIp}`);
        
        const throttleCheck = checkIPThrottle(referralData.userIp);
        console.log(`[ReferralService] Throttle check:`, throttleCheck);
        
        if (throttleCheck.throttled) {
          throw new Error(throttleCheck.reason || 'Rate limit exceeded');
        }
        
        // Record the attempt
        recordIPAttempt(referralData.userIp, false);
        console.log(`[ReferralService] IP attempt recorded for: ${referralData.userIp}`);
      } else {
        console.log(`[ReferralService] No IP provided for referral`);
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
          referred_user_id: referralData.referredUserId,
          referred_email: referralData.referredEmail.toLowerCase(),
          referred_ip: referralData.userIp,
          status: 'pending',
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
   * @param isEmailVerified - Whether the user's email is verified
   * @returns Success status and referrer info
   */
  static async validateReferralOnSignup(
    referredEmail: string,
    referredUserId: string,
    isEmailVerified: boolean = false
  ): Promise<{ success: boolean; referrerId?: string; referrerCode?: string }> {
    try {
      // Find pending referral for this email
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_email", referredEmail.toLowerCase())
        .eq("status", 'pending');
      
      console.log("[ReferralService] referrals:", referrals);
      
      if (error) {
        console.error("Error fetching referrals for validation:", error);
        return { success: false };
      }

      if (!referrals || referrals.length === 0) {
        return { success: false };
      }

      // Get the most recent referral
      const referral = referrals[0];

      // Only verify the referral if the user's email is confirmed
      const newStatus = isEmailVerified ? 'verified' : 'pending';
      
      // Update the referral with referred_user_id and status
      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          status: newStatus,
          referred_user_id: referredUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral.id);

      if (updateError) {
        console.error("Error updating referral:", updateError);
        return { success: false };
      }

      // Note: The trigger will automatically update referrer's referral_count and last_referral_at
      // when the status changes from 'pending' to 'verified'

      // Get referrer info for return
      const referrer = await UserService.getUserByReferralCode(
        referral.referrer_id
      );

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
   * Gets verified referrals count for a user
   * @param userId - The user ID to get count for
   * @returns Number of verified referrals
   */
  static async getVerifiedReferralsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", userId)
        .eq("status", 'verified');

      if (error) {
        console.error("Error fetching verified referrals count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getVerifiedReferralsCount:", error);
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
      console.log("[ReferralService] getLeaderboard called with limit:", limit);
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(limit);
      console.log(
        "[ReferralService] Supabase leaderboard data:",
        data,
        "error:",
        error
      );
      if (error) {
        console.error("[ReferralService] Error fetching leaderboard:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("[ReferralService] Error in getLeaderboard:", error);
      return [];
    }
  }

  /**
   * Tracks a referral visit (for analytics)
   * @param referralCode - The referral code that was visited
   * @returns Success status
   */
  static async trackReferralVisit(referralCode: string): Promise<boolean> {
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
    verifiedReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
  }> {
    try {
      const referrals = await this.getUserReferrals(userId);
      const totalReferrals = referrals.length;
      const verifiedReferrals = referrals.filter((r) => r.status === 'verified').length;
      const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
      const conversionRate =
        totalReferrals > 0 ? (verifiedReferrals / totalReferrals) * 100 : 0;
      return {
        totalReferrals,
        verifiedReferrals,
        pendingReferrals,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error("Error in getReferralStats:", error);
      return {
        totalReferrals: 0,
        verifiedReferrals: 0,
        pendingReferrals: 0,
        conversionRate: 0,
      };
    }
  }
}
