import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AdminService, Admin } from "@/services/adminService";

export interface AdminAuthState {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  error: string | null;
}

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    user: null,
    admin: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          try {
            // Check if user is an admin
            const admin = await AdminService.getCurrentAdmin();
            
            if (admin) {
              setAuthState({
                user: session.user,
                admin,
                loading: false,
                error: null,
              });
            } else {
              // User exists but is not an admin
              setAuthState({
                user: null,
                admin: null,
                loading: false,
                error: null,
              });
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            setAuthState({
              user: null,
              admin: null,
              loading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            admin: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error getting initial admin session:", error);
        setAuthState({
          user: null,
          admin: null,
          loading: false,
          error: "Failed to load admin session",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          try {
            // Check if user is an admin
            const admin = await AdminService.getCurrentAdmin();
            
            if (admin) {
              setAuthState({
                user: session.user,
                admin,
                loading: false,
                error: null,
              });
            } else {
              // User exists but is not an admin, sign them out
              await supabase.auth.signOut();
              setAuthState({
                user: null,
                admin: null,
                loading: false,
                error: null,
              });
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            setAuthState({
              user: null,
              admin: null,
              loading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            admin: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error handling admin auth state change:", error);
        setAuthState({
          user: session?.user || null,
          admin: null,
          loading: false,
          error: "Failed to load admin profile",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const adminLogin = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await AdminService.adminLogin(email, password);

      if (result.success && result.admin) {
        setAuthState({
          user: result.admin as any, // Type assertion for compatibility
          admin: result.admin,
          loading: false,
          error: null,
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "Login failed",
        }));
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Failed to login";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const adminSignOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await AdminService.adminSignOut();

      if (result.success) {
        setAuthState({
          user: null,
          admin: null,
          loading: false,
          error: null,
        });
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Failed to sign out";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const refreshAdmin = async () => {
    try {
      if (authState.user) {
        const admin = await AdminService.getCurrentAdmin();
        setAuthState((prev) => ({ ...prev, admin }));
      }
    } catch (error) {
      console.error("Error refreshing admin profile:", error);
    }
  };

  return {
    ...authState,
    adminLogin,
    adminSignOut,
    refreshAdmin,
  };
}; 