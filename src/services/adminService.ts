import { supabase } from '@/lib/supabase';
import { generateSecureToken } from '@/utils/generateReferralCode';
import { generateSecurePassword } from '@/utils/generatePassword';
import { sendEmail } from '@/lib/sendEmail';

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
   * Create admin invitation and signup user
   */
  static async createInvitation(
    email: string, 
    role: 'super_admin' | 'admin' = 'admin',
    invitedBy: string
  ): Promise<{ success: boolean; invitation?: AdminInvitation; password?: string; error?: string }> {
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

      // Generate secure token and password
      const token = generateSecureToken();
      const password = generateSecurePassword();
      
      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // First create the Supabase auth user using signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return { success: false, error: authError?.message || 'Failed to create user account' };
      }

      // Create admin record in admins table
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: email,
          role: role,
          is_active: true,
          invited_by: invitedBy,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (adminError) {
        // If admin creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Error creating admin record:', adminError);
        return { success: false, error: 'Failed to create admin record' };
      }

      // Create invitation record
      const { data: invitationData, error: invitationError } = await supabase
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

      if (invitationError) {
        // If invitation creation fails, clean up admin and auth user
        await supabase.from('admins').delete().eq('id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Error creating invitation:', invitationError);
        return { success: false, error: 'Failed to create invitation' };
      }

      // Send invitation email
      try {
        await sendEmail({
          to: process.env.NEXT_PUBLIC_EMAIL_TO || email,
          subject: 'Admin Invitation - Bonbon Waitlist',
          text: `
You have been invited as a ${role} for the Bonbon Waitlist.

Your login credentials:
Email: ${email}
Password: ${password}

Please use these credentials to log in to the admin panel.
This invitation will expire in 7 days.

Best regards,
Bonbon Waitlist Team`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin: 0; font-size: 24px;">Welcome to Bonbon Waitlist</h1>
        <div style="width: 50px; height: 4px; background-color: #4F46E5; margin: 20px auto;"></div>
      </div>

      <!-- Main Content -->
      <div style="color: #374151; font-size: 16px; line-height: 24px;">
        <p>You have been invited as a <span style="color: #4F46E5; font-weight: bold; text-transform: capitalize;">${role}</span> for the Bonbon Waitlist.</p>
        
        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h2 style="color: #4F46E5; margin: 0 0 15px 0; font-size: 18px;">Your Login Credentials</h2>
          <div style="margin-bottom: 10px;">
            <strong style="color: #6B7280;">Email:</strong>
            <div style="color: #111827; margin-top: 5px; padding: 8px; background-color: white; border-radius: 4px;">${email}</div>
          </div>
          <div>
            <strong style="color: #6B7280;">Password:</strong>
            <div style="color: #111827; margin-top: 5px; padding: 8px; background-color: white; border-radius: 4px; font-family: monospace;">${password}</div>
          </div>
        </div>

        <!-- Login Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/login" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Login to Admin Panel
          </a>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
          <p style="margin: 0;">Best regards,<br>Bonbon Waitlist Team</p>
        </div>
      </div>
    </div>

    <!-- Footer Note -->
    <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px;">
      <p>If you didn't request this invitation, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`,
        });
        console.log('Invitation email sent successfully');
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        // Don't return error here, the invitation is still created
      }

      return { 
        success: true, 
        invitation: invitationData,
        password 
      };
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
   * Delete admin user
   */
  static async deleteAdmin(adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if admin exists
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();

      if (adminError || !admin) {
        return { success: false, error: 'Admin not found' };
      }

      // Delete from admins table
      const { error: deleteAdminError } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (deleteAdminError) {
        console.error('Error deleting admin:', deleteAdminError);
        return { success: false, error: 'Failed to delete admin record' };
      }

      // Delete from admin_invitations table if exists
      await supabase
        .from('admin_invitations')
        .delete()
        .eq('email', admin.email);

      // For deleting from Supabase auth, we need to make an API call to your backend
      // You should implement an API endpoint that uses Supabase service role key to delete the user
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: adminId }),
      });

      if (!response.ok) {
        console.error('Error deleting auth user');
        // Don't return error here as the admin is already deleted from our tables
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteAdmin:', error);
      return { success: false, error: 'An unexpected error occurred' };
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