import { supabase } from "@/lib/supabase";

export interface Wave {
  id: string;
  name: string;
  description?: string;
  start_position: number;
  end_position: number;
  is_active: boolean;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWaveData {
  name: string;
  description?: string;
  start_position: number;
  end_position: number;
}

export interface WaveStats {
  total_users: number;
  active_users: number;
  pending_users: number;
}

/**
 * Wave service for managing wave definitions and user access
 */
export class WaveService {
  /**
   * Creates a new wave
   * @param waveData - The wave data to create
   * @returns The created wave
   */
  static async createWave(waveData: CreateWaveData): Promise<Wave> {
    try {
      // First create the wave
      const { data: wave, error: waveError } = await supabase
        .from("waves")
        .insert(waveData)
        .select()
        .single();

      if (waveError) {
        console.error("Error creating wave:", waveError);
        throw new Error("Failed to create wave");
      }

      // Find and update users whose referral_count falls within the wave's range
      const { data: updatedUsers, error: updateError } = await supabase
        .from("users")
        .update({ wave_id: wave.id })
        .gte('referral_count', waveData.start_position)
        .lte('referral_count', waveData.end_position)
        .select();

      if (updateError) {
        console.error("Error assigning users to wave:", updateError);
        // Don't throw here - wave was created successfully
      } else {
        console.log(`Assigned ${updatedUsers?.length || 0} users to wave ${wave.id}`);
      }

      return wave;
    } catch (error) {
      console.error("Error in createWave:", error);
      throw error;
    }
  }

  /**
   * Gets all waves
   * @returns Array of waves
   */
  static async getAllWaves(): Promise<Wave[]> {
    try {
      const { data, error } = await supabase
        .from("waves")
        .select("*")
        .order("start_position", { ascending: true });

      if (error) {
        console.error("Error fetching waves:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllWaves:", error);
      return [];
    }
  }

  /**
   * Gets a wave by ID
   * @param waveId - The wave ID
   * @returns The wave or null
   */
  static async getWaveById(waveId: string): Promise<Wave | null> {
    try {
      const { data, error } = await supabase
        .from("waves")
        .select("*")
        .eq("id", waveId)
        .single();

      if (error) {
        console.error("Error fetching wave:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getWaveById:", error);
      return null;
    }
  }

  /**
   * Updates a wave
   * @param waveId - The wave ID
   * @param updates - The updates to apply
   * @returns The updated wave
   */
  static async updateWave(
    waveId: string,
    updates: Partial<CreateWaveData>
  ): Promise<Wave | null> {
    try {
      console.log(updates, "updates");
      // First update the wave
      const { data: wave, error: waveError } = await supabase
        .from("waves")
        .update(updates)
        .eq("id", waveId)
        .select()
        .single();

      if (waveError) {
        console.error("Error updating wave:", waveError);
        return null;
      }
      console.log(updates, "updates");

      // If start_position or end_position was updated, we need to reassign users
      if (updates.start_position !== undefined || updates.end_position !== undefined) {
        // First, get the current wave data to know the new range
        const { data: currentWave, error: fetchError } = await supabase
          .from("waves")
          .select("start_position, end_position")
          .eq("id", waveId)
          .single();

        if (fetchError) {
          console.error("Error fetching current wave:", fetchError);
          return wave;
        }

        // Remove wave_id from users who are now outside the range
        const { data: removedUsers, error: removeError } = await supabase
          .from("users")
          .update({ wave_id: null, access_granted: false })
          .eq("wave_id", waveId)
          .or(`referral_count.lt.${currentWave.start_position},referral_count.gt.${currentWave.end_position}`)
          .select();

        if (removeError) {
          console.error("Error removing users from wave:", removeError);
        } else {
          console.log(`Removed ${removedUsers?.length || 0} users from wave ${waveId} who are now out of range`);
        }

        // Update users who should be in this wave based on the new range
        const { data: updatedUsers, error: updateError } = await supabase
          .from("users")
          .update({ wave_id: waveId })
          .gte('referral_count', currentWave.start_position)
          .lte('referral_count', currentWave.end_position)
          .is('wave_id', null) // Only assign users who aren't already in a wave
          .select();

        if (updateError) {
          console.error("Error updating users for wave:", updateError);
        } else {
          console.log(`Assigned ${updatedUsers?.length || 0} new users to wave ${waveId}`);
        }
      }

      return wave;
    } catch (error) {
      console.error("Error in updateWave:", error);
      return null;
    }
  }

  /**
   * Deletes a wave
   * @param waveId - The wave ID
   * @returns Success status
   */
  static async deleteWave(waveId: string): Promise<boolean> {
    try {
      // First, remove all users from this wave to avoid foreign key constraint
      const { data: updatedUsers, error: updateError } = await supabase
        .from("users")
        .update({ wave_id: null, access_granted: false })
        .eq("wave_id", waveId)
        .select();

      if (updateError) {
        console.error("Error removing users from wave:", updateError);
        return false;
      }

      console.log(`Updated ${updatedUsers?.length || 0} users for wave ${waveId}`);

      // Then delete the wave
      const { error } = await supabase
        .from("waves")
        .delete()
        .eq("id", waveId);

      if (error) {
        console.error("Error deleting wave:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteWave:", error);
      return false;
    }
  }

  /**
   * Activates a wave and grants access to all users in that wave
   * @param waveId - The wave ID
   * @returns Success status
   */
  static async activateWave(waveId: string): Promise<boolean> {
    try {
      // First update the wave status
      const { error: waveError } = await supabase
        .from("waves")
        .update({ 
          is_active: true,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", waveId);

      if (waveError) {
        console.error("Error activating wave:", waveError);
        return false;
      }

      // Then update access_granted for all users in this wave
      const { data: updatedUsers, error: userError } = await supabase
        .from("users")
        .update({ access_granted: true })
        .eq("wave_id", waveId)
        .select();

      if (userError) {
        console.error("Error granting access to users:", userError);
        return false;
      }

      console.log(`Granted access to ${updatedUsers?.length || 0} users in wave ${waveId}`);
      return true;
    } catch (error) {
      console.error("Error in activateWave:", error);
      return false;
    }
  }

  /**
   * Deactivates a wave and revokes access from all users in that wave
   * @param waveId - The wave ID
   * @returns Success status
   */
  static async deactivateWave(waveId: string): Promise<boolean> {
    try {
      // First update the wave status
      const { error: waveError } = await supabase
        .from("waves")
        .update({ 
          is_active: false, 
          activated_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", waveId);

      if (waveError) {
        console.error("Error deactivating wave:", waveError);
        return false;
      }

      // Then update access_granted for all users in this wave
      const { data: updatedUsers, error: userError } = await supabase
        .from("users")
        .update({ access_granted: false })
        .eq("wave_id", waveId)
        .select();

      if (userError) {
        console.error("Error revoking access from users:", userError);
        return false;
      }

      console.log(`Revoked access from ${updatedUsers?.length || 0} users in wave ${waveId}`);
      return true;
    } catch (error) {
      console.error("Error in deactivateWave:", error);
      return false;
    }
  }

  /**
   * Assigns users to waves based on their waitlist position
   * @returns Number of users assigned
   */
  static async assignUsersToWaves(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('assign_users_to_waves');

      if (error) {
        console.error("Error assigning users to waves:", error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error("Error in assignUsersToWaves:", error);
      return 0;
    }
  }

  /**
   * Gets wave statistics including user counts
   * @param waveId - The wave ID
   * @returns Wave statistics
   */
  static async getWaveStats(waveId: string): Promise<WaveStats> {
    try {
      // Use count instead of select to avoid 406 errors
      const { count: totalUsers, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("wave_id", waveId);

      if (countError) {
        console.error("Error fetching wave user count:", countError);
        return {
          total_users: 0,
          active_users: 0,
          pending_users: 0,
        };
      }

      // Get active users count
      const { count: activeUsers, error: activeError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("wave_id", waveId)
        .eq("access_granted", true);

      if (activeError) {
        console.error("Error fetching active users count:", activeError);
        return {
          total_users: totalUsers || 0,
          active_users: 0,
          pending_users: totalUsers || 0,
        };
      }

      const pendingUsers = (totalUsers || 0) - (activeUsers || 0);

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        pending_users: pendingUsers,
      };
    } catch (error) {
      console.error("Error in getWaveStats:", error);
      return {
        total_users: 0,
        active_users: 0,
        pending_users: 0,
      };
    }
  }

  /**
   * Gets all wave statistics
   * @returns Array of waves with their statistics
   */
  static async getAllWavesWithStats(): Promise<(Wave & WaveStats)[]> {
    try {
      const waves = await this.getAllWaves();
      const wavesWithStats = await Promise.all(
        waves.map(async (wave) => {
          const stats = await this.getWaveStats(wave.id);
          return { ...wave, ...stats };
        })
      );

      return wavesWithStats;
    } catch (error) {
      console.error("Error in getAllWavesWithStats:", error);
      return [];
    }
  }

  /**
   * Gets the wave for a specific user
   * @param userId - The user ID
   * @returns The wave or null
   */
  static async getUserWave(userId: string): Promise<Wave | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("wave_id")
        .eq("id", userId)
        .single();

      if (error || !data?.wave_id) {
        return null;
      }

      return await this.getWaveById(data.wave_id);
    } catch (error) {
      console.error("Error in getUserWave:", error);
      return null;
    }
  }

  /**
   * Checks if a user has access granted
   * @param userId - The user ID
   * @returns Whether the user has access
   */
  static async userHasAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("access_granted")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking user access:", error);
        return false;
      }

      return data?.access_granted || false;
    } catch (error) {
      console.error("Error in userHasAccess:", error);
      return false;
    }
  }


} 