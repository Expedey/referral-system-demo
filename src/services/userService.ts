import { supabase } from "@/lib/supabase";
import { generateReferralCode } from "@/utils/generateReferralCode";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  referral_code: string;
  referred_by?: string;
  is_verified: boolean;
  created_at: string;
}

export interface CreateUserProfileData {
  id: string;
  email: string;
  username?: string;
  referralCode?: string;
}

/**
 * User service for managing user profiles and authentication
 */
export class UserService {
  /**
   * Creates a new user profile after successful authentication
   * @param userData - User data from Supabase Auth
   * @returns The created user profile
   */
  static async createUserProfile(
    userData: CreateUserProfileData
  ): Promise<UserProfile> {
    try {
      // Generate unique referral code
      const referralCode =
        userData.referralCode || generateReferralCode(userData.username);

      const { data, error } = await supabase
        .from("users")
        .insert({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          referral_code: referralCode.toUpperCase(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user profile:", error);
        throw new Error("Failed to create user profile");
      }

      return data;
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      throw error;
    }
  }

  /**
   * Gets the current user's profile
   * @returns The user profile or null if not found
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getCurrentUserProfile:", error);
      return null;
    }
  }

  /**
   * Gets a user profile by referral code
   * @param referralCode - The referral code to look up
   * @returns The user profile or null if not found
   */
  static async getUserByReferralCode(
    referralCode: string
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (error) {
        console.error("Error fetching user by referral code:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getUserByReferralCode:", error);
      return null;
    }
  }

  /**
   * Updates user verification status
   * @param userId - The user ID to update
   * @param isVerified - The verification status
   * @returns Success status
   */
  static async updateVerificationStatus(
    userId: string,
    isVerified: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_verified: isVerified })
        .eq("id", userId);

      if (error) {
        console.error("Error updating verification status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateVerificationStatus:", error);
      return false;
    }
  }

  /**
   * Associates a user with a referrer
   * @param userId - The user ID to associate
   * @param referrerCode - The referrer's referral code
   * @returns Success status
   */
  static async associateWithReferrer(
    userId: string,
    referrerCode: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ referred_by: referrerCode.toUpperCase() })
        .eq("id", userId);

      if (error) {
        console.error("Error associating with referrer:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in associateWithReferrer:", error);
      return false;
    }
  }

  /**
   * Gets user statistics including referral count and waitlist position
   * @param userId - The user ID to get stats for
   * @returns User statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalReferrals: number;
    waitlistPosition: number;
    isVerified: boolean;
  }> {
    try {
      // Get user's referral count
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", userId)
        .eq("is_valid", true);

      if (referralsError) {
        console.error("Error fetching referrals:", referralsError);
        throw new Error("Failed to fetch referral data");
      }

      // Get user's waitlist position from leaderboard view
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("leaderboard")
        .select("rank")
        .eq("id", userId)
        .single();

      if (leaderboardError) {
        console.error("Error fetching leaderboard data:", leaderboardError);
        throw new Error("Failed to fetch leaderboard data");
      }

      // Get user verification status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("is_verified")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        throw new Error("Failed to fetch user data");
      }

      return {
        totalReferrals: referrals?.length || 0,
        waitlistPosition: leaderboardData?.rank || 0,
        isVerified: userData?.is_verified || false,
      };
    } catch (error) {
      console.error("Error in getUserStats:", error);
      throw error;
    }
  }

  /**
   * Signs out the current user
   * @returns Success status
   */
  static async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in signOut:", error);
      return false;
    }
  }
}
