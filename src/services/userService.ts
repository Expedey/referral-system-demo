import { supabase } from "@/lib/supabase";
import { generateReferralCode } from "@/utils/generateReferralCode";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  referral_code: string;
  is_verified: boolean;
  referral_count: number;
  last_referral_at?: string;
  user_type: 'regular' | 'corporate';
  sex?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  created_at: string;
}

export interface CreateUserProfileData {
  id: string;
  email: string;
  username?: string;
  user_type: 'regular' | 'corporate';
  sex?: 'male' | 'female' | 'other';
  date_of_birth?: string;
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
      const referralCode = generateReferralCode(userData.username);

      const { data, error } = await supabase
        .from("users")
        .insert({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          referral_code: referralCode.toUpperCase(),
          user_type: userData.user_type || 'regular',
          sex: userData.sex,
          date_of_birth: userData.date_of_birth,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user profile:", error);
        throw new Error("Failed to create user profile");
      }

      // Note: HubSpot sync will be handled after email confirmation
      // to ensure only verified users are synced to HubSpot

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
   * Gets a user profile by user ID
   * @param userId - The user ID to look up
   * @returns The user profile or null if not found
   */
  static async getUserById(
    userId: string
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user by ID:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getUserById:", error);
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
      // Get user's referral count and waitlist position in parallel
      const [userResult, leaderboardResult] = await Promise.allSettled([
        supabase
          .from("users")
          .select("referral_count, is_verified")
          .eq("id", userId)
          .single(),
        supabase
          .from("leaderboard")
          .select("rank")
          .eq("id", userId)
          .single()
      ]);

      // Handle user data result
      if (userResult.status === 'rejected') {
        console.error("Error fetching user data:", userResult.reason);
        throw new Error("Failed to fetch user data");
      }

      const { data: userData, error: userError } = userResult.value;
      if (userError) {
        console.error("Error fetching user data:", userError);
        throw new Error("Failed to fetch user data");
      }

      // Handle leaderboard result
      let waitlistPosition = 0;
      if (leaderboardResult.status === 'fulfilled') {
        const { data: leaderboardData, error: leaderboardError } = leaderboardResult.value;
        if (!leaderboardError && leaderboardData) {
          waitlistPosition = leaderboardData.rank || 0;
        }
      } else {
        console.warn("Failed to fetch leaderboard data:", leaderboardResult.reason);
        // Don't throw error for leaderboard, just use default value
      }

      return {
        totalReferrals: userData?.referral_count || 0,
        waitlistPosition,
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
