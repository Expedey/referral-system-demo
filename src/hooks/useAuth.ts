import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UserService, UserProfile } from "@/services/userService";

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean; // Keep for compatibility but don't check here
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    isAdmin: false, // Default to false, will be checked separately if needed
  });
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let hasInitialized = false;

    // Get initial session with timeout
    const getInitialSession = async () => {
      if (hasInitialized) return; // Prevent multiple initializations
      
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted && !hasInitialized) {
            console.warn("Auth initialization timed out, setting loading to false");
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Authentication timeout",
              isAdmin: false,
            });
            hasInitialized = true;
          }
        }, 10000); // 10 second timeout

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted || hasInitialized) return;

        if (session?.user) {
          try {
            // Get user profile
            const profile = await UserService.getCurrentUserProfile();
            
            // Email verification sync (non-blocking)
            const isEmailVerified = !!session.user.email_confirmed_at;
            if (isEmailVerified && profile && !profile.is_verified) {
              // Fire and forget - don't wait for this
              UserService.updateVerificationStatus(session.user.id, true).catch(console.error);
              handleEmailVerification(session.user.id).catch(console.error);
            }

            if (isMounted && !hasInitialized) {
              setAuthState({
                user: session.user,
                profile,
                loading: false,
                error: null,
                isAdmin: false, // Will be checked separately if needed
              });
              hasInitialized = true;
            }
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            if (isMounted && !hasInitialized) {
              setAuthState({
                user: session.user,
                profile: null,
                loading: false,
                error: "Failed to load user profile",
                isAdmin: false,
              });
              hasInitialized = true;
            }
          }
        } else {
          if (isMounted && !hasInitialized) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: null,
              isAdmin: false,
            });
            hasInitialized = true;
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (isMounted && !hasInitialized) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: "Failed to load session",
            isAdmin: false,
          });
          hasInitialized = true;
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Only handle auth changes after initial load
      if (!hasInitialized) return;

      try {
        if (session?.user) {
          try {
            const profile = await UserService.getCurrentUserProfile();
            
            // Email verification sync (non-blocking)
            const isEmailVerified = !!session.user.email_confirmed_at;
            if (isEmailVerified && profile && !profile.is_verified) {
              UserService.updateVerificationStatus(session.user.id, true).catch(console.error);
              handleEmailVerification(session.user.id).catch(console.error);
              setEmailVerified(true);
            }

            if (isMounted) {
              setAuthState({
                user: session.user,
                profile,
                loading: false,
                error: null,
                isAdmin: false,
              });
            }
          } catch (profileError) {
            console.error("Error fetching user profile on auth change:", profileError);
            if (isMounted) {
              setAuthState({
                user: session.user,
                profile: null,
                loading: false,
                error: "Failed to load user profile",
                isAdmin: false,
              });
            }
          }
        } else {
          if (isMounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: null,
              isAdmin: false,
            });
          }
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        if (isMounted) {
          setAuthState({
            user: session?.user || null,
            profile: null,
            loading: false,
            error: "Failed to load session",
            isAdmin: false,
          });
        }
      }
    });

    return () => {
      isMounted = false;
      hasInitialized = true; // Prevent further initializations
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    userType: 'regular' | 'corporate' = 'regular',
    sex?: 'male' | 'female' | 'other',
    dateOfBirth?: string
  ) => {
    try {
      console.log("[useAuth] Starting signup with user type:", userType);
      // Don't set global loading state during signup
      // The component should handle its own loading state

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        console.log(data,"data",sex,dateOfBirth);
        // Create user profile
        console.log("[useAuth] Creating user profile with type:", userType);
        const profile = await UserService.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          username,
          user_type: userType,
          sex,
          date_of_birth: dateOfBirth,
        });
        console.log("[useAuth] Created user profile:", profile);

        // Don't set user state immediately for new signups
        // Let the component handle the flow (show alert, then redirect after email verification)
        // Only set user state if email is already confirmed
        if (data.user.email_confirmed_at) {
          setAuthState({
            user: data.user,
            profile,
            loading: false,
            error: null,
            isAdmin: false,
          });
        }
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
      // Don't set global loading state during signin
      // The component should handle its own loading state

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
          isAdmin: false, // New users are not admins
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
          isAdmin: false,
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

  const handleEmailVerification = async (userId: string) => {
    try {
      // Update user verification status in Supabase
      await UserService.updateVerificationStatus(userId, true);
      
      // Get user profile for HubSpot sync
      const userProfile = await UserService.getCurrentUserProfile();
      
      if (userProfile) {
        // Sync user to HubSpot after email confirmation
        try {
          console.log("[useAuth] Syncing verified user to HubSpot:", userProfile.email);
          
          const hubspotData = {
            email: userProfile.email,
            referral_code: userProfile.referral_code,
            referral_count: userProfile.referral_count,
            last_referral_at: userProfile.last_referral_at,
          };
          
          const response = await fetch('/api/hubspot/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(hubspotData),
          });

          if (response.ok) {
            console.log("[useAuth] User synced to HubSpot successfully after email confirmation");
          } else {
            console.error("[useAuth] HubSpot sync failed after email confirmation:", response.status);
          }
        } catch (hubspotError) {
          console.error("[useAuth] Error syncing to HubSpot after email confirmation:", hubspotError);
          // Don't throw error - HubSpot sync failure shouldn't break email verification
        }
      }

      // Find and verify any pending referrals for this user
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_user_id", userId)
        .eq("status", 'pending');

      if (error) {
        console.error("Error fetching pending referrals:", error);
        return;
      }

      if (referrals && referrals.length > 0) {
        console.log(`[useAuth] Found ${referrals.length} pending referrals to verify`);
        
        // Update all pending referrals to verified
        const { error: updateError } = await supabase
          .from("referrals")
          .update({ status: 'verified' })
          .eq("referred_user_id", userId)
          .eq("status", 'pending');

        if (updateError) {
          console.error("Error updating referrals to verified:", updateError);
        } else {
          console.log(`Updated ${referrals.length} referrals to verified status`);
          
          // After referrals are verified, sync referrer's updated stats to HubSpot
          for (const referral of referrals) {
            try {
              // Get referrer's updated profile (with new referral count)
              const { data: referrerProfile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", referral.referrer_id)
                .single();
                console.log("[useAuth] Referrer profile:", referrerProfile);

              if (profileError) {
                console.error("[useAuth] Error fetching referrer profile:", profileError);
                continue;
              }
              
              if (referrerProfile) {
                console.log("[useAuth] Syncing referrer's updated stats to HubSpot:", referrerProfile.email);
                
                // Update referrer's stats in HubSpot via server-side API
                const response = await fetch('/api/hubspot/update-referrer-stats', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: referrerProfile.email,
                    referralCount: referrerProfile.referral_count,
                    lastReferralAt: new Date().toISOString(),
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log("[useAuth] Referrer's updated stats synced to HubSpot successfully:", result);
                } else {
                  console.error("[useAuth] Failed to sync referrer's stats to HubSpot:", response.status);
                  const errorData = await response.json();
                  console.error("[useAuth] HubSpot sync error:", errorData);
                }
              }
            } catch (referrerError) {
              console.error("[useAuth] Error syncing referrer's stats to HubSpot:", referrerError);
              // Don't throw error - HubSpot sync failure shouldn't break email verification
            }
          }
        }
      } else {
        console.log("[useAuth] No pending referrals found for user");
      }
    } catch (error) {
      console.error("Error handling email verification:", error);
    }
  };

  return {
    ...authState,
    emailVerified,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    handleEmailVerification,
  };
};
