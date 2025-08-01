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
      const { data, error } = await supabase
        .from("waves")
        .insert(waveData)
        .select()
        .single();

      if (error) {
        console.error("Error creating wave:", error);
        throw new Error("Failed to create wave");
      }

      return data;
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
      const { data, error } = await supabase
        .from("waves")
        .update(updates)
        .eq("id", waveId)
        .select()
        .single();

      if (error) {
        console.error("Error updating wave:", error);
        return null;
      }

      return data;
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
      const { error: updateError } = await supabase
        .from("users")
        .update({ wave_id: null, access_granted: false })
        .eq("wave_id", waveId);

      if (updateError) {
        console.error("Error removing users from wave:", updateError);
        return false;
      }

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
      const { data, error } = await supabase.rpc('activate_wave', {
        wave_uuid: waveId
      });

      if (error) {
        console.error("Error activating wave:", error);
        return false;
      }

      return data;
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
      // Try the database function first
      const { data, error } = await supabase.rpc('deactivate_wave', {
        wave_uuid: waveId
      });

      if (error) {
        console.error("Database function failed, using fallback:", error);
        
        // Fallback: manually update the wave and users
        const { error: waveError } = await supabase
          .from("waves")
          .update({ 
            is_active: false, 
            activated_at: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", waveId);

        if (waveError) {
          console.error("Error updating wave status:", waveError);
          return false;
        }

        // Update all users in this wave to revoke access
        const { error: usersError } = await supabase
          .from("users")
          .update({ access_granted: false })
          .eq("wave_id", waveId);

        if (usersError) {
          console.error("Error revoking user access:", usersError);
          return false;
        }

        return true;
      }

      return data;
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