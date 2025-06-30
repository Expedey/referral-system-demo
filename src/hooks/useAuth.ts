import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserService, UserProfile } from "@/services/userService";

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
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
          let profile = await UserService.getCurrentUserProfile();
          // Email verification sync
          const isEmailVerified = !!session.user.email_confirmed_at;
          if (isEmailVerified && profile && !profile.is_verified) {
            await UserService.updateVerificationStatus(session.user.id, true);
            profile = await UserService.getCurrentUserProfile();
          }
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: "Failed to load session",
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
          let profile = await UserService.getCurrentUserProfile();
          // Email verification sync
          const isEmailVerified = !!session.user.email_confirmed_at;
          if (isEmailVerified && profile && !profile.is_verified) {
            await UserService.updateVerificationStatus(session.user.id, true);
            profile = await UserService.getCurrentUserProfile();
          }
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setAuthState({
          user: session?.user || null,
          profile: null,
          loading: false,
          error: "Failed to load user profile",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create user profile
        const profile = await UserService.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          username,
        });

        setAuthState({
          user: data.user,
          profile,
          loading: false,
          error: null,
        });
      }

      return { success: true, user: data.user };
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Failed to sign up";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const profile = await UserService.getCurrentUserProfile();
        setAuthState({
          user: data.user,
          profile,
          loading: false,
          error: null,
        });
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Failed to sign in";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const success = await UserService.signOut();

      if (success) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }

      return { success };
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

  const refreshProfile = async () => {
    try {
      if (authState.user) {
        const profile = await UserService.getCurrentUserProfile();
        setAuthState((prev) => ({ ...prev, profile }));
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
};
