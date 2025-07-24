import { supabase } from '@/lib/supabase';
import { generateSecureToken } from '@/utils/generateReferralCode';

export interface Admin {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  token: string;
  role: 'super_admin' | 'admin' | 'moderator';
  invited_by: string;
  expires_at: string;
  created_at: string;
}



export class AdminService {
  /**
   * Get current admin profile
   */
  static async getCurrentAdmin(): Promise<Admin | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching admin:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentAdmin:', error);
      return null;
    }
  }

  /**
   * Admin login
   */
  static async adminLogin(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    try {
      // First, check if the user exists as an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        return { success: false, error: 'Admin account not found or inactive' };
      }

      // Attempt to sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Update last login time
        await this.updateLastLogin(adminData.id);

        return { success: true, admin: adminData };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Error in adminLogin:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Create admin invitation
   */
  static async createInvitation(
    email: string, 
    role: 'super_admin' | 'admin' | 'moderator' = 'admin',
    invitedBy: string
  ): Promise<{ success: boolean; invitation?: AdminInvitation; error?: string }> {
    try {
      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();

      if (existingAdmin) {
        return { success: false, error: 'Admin already exists with this email' };
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('admin_invitations')
        .select('id')
        .eq('email', email)
        .single();

      if (existingInvitation) {
        return { success: false, error: 'Invitation already exists for this email' };
      }

      // Generate secure token
      const token = generateSecureToken();
      
      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('admin_invitations')
        .insert({
          email,
          token,
          role,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        return { success: false, error: 'Failed to create invitation' };
      }



      return { success: true, invitation: data };
    } catch (error) {
      console.error('Error in createInvitation:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Accept admin invitation
   */
  static async acceptInvitation(
    token: string, 
    password: string
  ): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    try {
      // Find the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (invitationError || !invitation) {
        return { success: false, error: 'Invalid or expired invitation token' };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Create the admin account
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .insert({
          email: invitation.email,
          role: invitation.role,
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (adminError) {
        console.error('Error creating admin:', adminError);
        return { success: false, error: 'Failed to create admin account' };
      }

      // Create Supabase auth user
      const { error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
      });

      if (authError) {
        // If auth creation fails, delete the admin record
        await supabase.from('admins').delete().eq('id', admin.id);
        return { success: false, error: authError.message };
      }

      // Delete the invitation
      await supabase.from('admin_invitations').delete().eq('id', invitation.id);



      return { success: true, admin };
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all admins
   */
  static async getAllAdmins(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAdmins:', error);
      return [];
    }
  }

  /**
   * Get pending invitations
   */
  static async getPendingInvitations(): Promise<AdminInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingInvitations:', error);
      return [];
    }
  }

  /**
   * Update admin last login
   */
  static async updateLastLogin(adminId: string): Promise<void> {
    try {
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }



  /**
   * Admin sign out
   */
  static async adminSignOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in adminSignOut:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
} 