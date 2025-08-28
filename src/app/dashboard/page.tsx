"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import ReferralCard from "@/components/ReferralCard";
import WaitlistRank from "@/components/WaitlistRank";
import PositionUpdatePopup from "@/components/PositionUpdatePopup";
import AvatarSelectionModal from "@/components/AvatarSelectionModal";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { CircleIcon } from "@/components/circle";
import useUser from "@/hooks/useUser";

// Custom hook for animated counters with fade effects
const useAnimatedCounter = (value: number, duration: number = 1000) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showOldValue, setShowOldValue] = useState(false);
  const [oldValue, setOldValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    console.log(
      "useAnimatedCounter - value changed:",
      value,
      "prevValue:",
      prevValueRef.current
    );

    if (value !== prevValueRef.current) {
      console.log(
        "useAnimatedCounter - starting animation from",
        prevValueRef.current,
        "to",
        value
      );
      setIsAnimating(true);
      setOldValue(prevValueRef.current);
      setShowOldValue(true);

      const startValue = prevValueRef.current;
      const endValue = value;
      const startTime = Date.now();

      // First phase: fade out old value
      setTimeout(() => {
        setShowOldValue(false);

        // Second phase: animate to new value
        const animate = () => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentValue = Math.round(
            startValue + (endValue - startValue) * easeOutQuart
          );

          setDisplayValue(currentValue);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setDisplayValue(endValue);
            setIsAnimating(false);
            console.log(
              "useAnimatedCounter - animation completed, final value:",
              endValue
            );
          }
        };

        requestAnimationFrame(animate);
      }, 200); // Delay before starting the count animation

      prevValueRef.current = value;
    }
  }, [value, duration]);

  return { displayValue, isAnimating, showOldValue, oldValue };
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: userLoading, profile } = useUser();
  console.log(loading, userLoading, isAuthenticated, profile, "__loading");

  // const { user, profile, loading: authLoading } = useAuth();
  const [userStats, setUserStats] = useState<{
    totalReferrals: number;
    waitlistPosition: number;
    isVerified: boolean;
  } | null>(null);
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    verifiedReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
  } | null>(null);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showPositionUpdatePopup, setShowPositionUpdatePopup] = useState(false);
  const [positionUpdateData, setPositionUpdateData] = useState<{
    oldPosition: number;
    newPosition: number;
    isImprovement: boolean;
  } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loggedInBefore, setLoggedInBefore] = useState(false);
  const [showFirstTimeAvatarModal, setShowFirstTimeAvatarModal] =
    useState(false);
  console.log("loggedInBefore", loggedInBefore);

  // Simple share referral function
  const shareReferral = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const referralUrl = `${baseUrl}/ref/${profile?.referral_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join the waitlist!",
          text: `I'm on the waitlist! Use my referral code: ${profile?.referral_code}`,
          url: referralUrl,
        });
      } catch (error) {
        // Fallback to copy
        console.log(error);
        copyToClipboard(referralUrl);
      }
    } else {
      // Copy to clipboard
      copyToClipboard(referralUrl);
    }
  };

  // Simple copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.log(error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  // Animated counters
  const totalReferralsCounter = useAnimatedCounter(
    userStats?.totalReferrals || 0
  );
  const verifiedReferralsCounter = useAnimatedCounter(
    referralStats?.verifiedReferrals || 0
  );
  const pendingReferralsCounter = useAnimatedCounter(
    referralStats?.pendingReferrals || 0
  );
  const conversionRateCounter = useAnimatedCounter(
    referralStats?.conversionRate || 0
  );
  const waitlistPositionCounter = useAnimatedCounter(
    userStats?.waitlistPosition || 0
  );

  // Track position changes for popup
  const prevPositionRef = useRef(userStats?.waitlistPosition || 0);

  useEffect(() => {
    if (
      userStats?.waitlistPosition !== undefined &&
      prevPositionRef.current !== userStats.waitlistPosition
    ) {
      const oldPosition = prevPositionRef.current;
      const newPosition = userStats.waitlistPosition;
      const isImprovement = newPosition < oldPosition; // Lower number is better

      // Only show popup if there's an actual change and we have a previous position
      if (oldPosition > 0) {
        setPositionUpdateData({
          oldPosition,
          newPosition,
          isImprovement,
        });
        setShowPositionUpdatePopup(true);
      }

      // Update the ref after processing
      prevPositionRef.current = newPosition;
    }
  }, [userStats?.waitlistPosition]);

  console.log("Current userStats:", userStats);
  console.log("Current referralStats:", referralStats);
  console.log("isRefreshing:", isRefreshing);
  console.log("showRefreshNotification:", showRefreshNotification);

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!isAuthenticated || !profile) return;

    console.log("refreshUserData called for user:", profile?.id);

    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Set a new timeout to debounce rapid calls
    const timeout = setTimeout(async () => {
      try {
        setIsRefreshing(true);
        setError(null);

        console.log("Fetching updated user stats...");

        // Add a small delay to ensure database transaction is committed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Load user stats and referral stats in parallel with proper timeout handling
        const [stats, refStats] = await Promise.allSettled([
          UserService.getUserStats(profile?.id),
          ReferralService.getReferralStats(profile?.id),
        ]);

        console.log("User stats result:", stats);
        console.log("Referral stats result:", refStats);

        // Handle user stats
        if (stats.status === "fulfilled") {
          console.log("Setting user stats:", stats.value);
          setUserStats(stats.value);
        } else {
          console.error("Error loading user stats:", stats.reason);
          // Don't set error for individual failures, just log them
        }

        // Handle referral stats
        if (refStats.status === "fulfilled") {
          console.log("Setting referral stats:", refStats.value);
          setReferralStats(refStats.value);
        } else {
          console.error("Error loading referral stats:", refStats.reason);
          // Don't set error for individual failures, just log them
        }

        // Only show error if both failed
        if (stats.status === "rejected" && refStats.status === "rejected") {
          setError("Failed to load dashboard data");
        }

        // Show refresh notification if at least one stat was loaded successfully
        if (stats.status === "fulfilled" || refStats.status === "fulfilled") {
          setShowRefreshNotification(true);
          setTimeout(() => setShowRefreshNotification(false), 3000);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        setError("Failed to refresh dashboard data");
      } finally {
        setIsRefreshing(false);
      }
    }, 500); // Reduced debounce time to 500ms for faster updates

    setRefreshTimeout(timeout);
  };

  // supabase.channel('any').on(
  //           'postgres_changes',
  //           {
  //             event: '*',
  //             schema: 'public',
  //             table: 'users'
  //           },
  //           (payload) => {
  //             console.log('Received change:', payload);
  //           }
  //         ).subscribe();

  useEffect(() => {
    async function init() {
      if (!isAuthenticated) return;

      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (token) {
          supabase.realtime.setAuth(token);
        }

        // Create channel for users table changes (filtered to current user)
        const usersChannel = supabase
          .channel("user-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "users",
              filter: `id=eq.${profile?.id}`,
            },
            (payload) => {
              console.log("User Change:", payload);
              console.log("User Change - new data:", payload.new);
              console.log("User Change - old data:", payload.old);
              console.log("Refreshing user stats due to user data change");
              // Refresh user stats when user data changes
              refreshUserData();
            }
          )
          .subscribe((status) => {
            console.log("Users channel status:", status);
            if (status === "CHANNEL_ERROR") {
              console.error("Users channel error occurred");
              // Don't throw error, just log it
            }
          });

        // Create channel for referrals table changes (filtered to current user's referrals)
        const referralsChannel = supabase
          .channel("referrals-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "referrals",
              filter: `referrer_id=eq.${profile?.id}`,
            },
            (payload) => {
              console.log("Referral Change:", payload);
              console.log("Referral Change - new data:", payload.new);
              console.log("Referral Change - old data:", payload.old);
              console.log(
                "Refreshing referral stats due to referral data change"
              );
              // Refresh referral stats when referral data changes
              refreshUserData();
            }
          )
          .subscribe((status) => {
            console.log("Referrals channel status:", status);
            if (status === "CHANNEL_ERROR") {
              console.error("Referrals channel error occurred");
              // Don't throw error, just log it
            }
          });

        return () => {
          usersChannel.unsubscribe();
          referralsChannel.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up realtime channels:", error);
        // Don't throw error, just log it
      }
    }

    const cleanup = init();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
      // Clean up any pending refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Redirect if not authenticated
    // if (!authLoading && !user) {
    //   router.push("/signup");
    //   return;
    // }

    const loadUserData = async () => {
      if (!profile) return;
      try {
        setError(null);
        console.log("fetching user data");
        // Load user stats, referral stats, and avatar status in parallel
        const [stats, refStats, avatarStatus] = await Promise.allSettled([
          UserService.getUserStats(profile.id),
          ReferralService.getReferralStats(profile.id),
          UserService.getUserAvatarStatus(profile.id),
        ]);

        // Handle user stats
        if (stats.status === "fulfilled") {
          setUserStats(stats.value);
        } else {
          console.error("Error loading user stats:", stats.reason);
          setError("Failed to load user statistics");
        }

        // Handle referral stats
        if (refStats.status === "fulfilled") {
          setReferralStats(refStats.value);
        } else {
          console.error("Error loading referral stats:", refStats.reason);
          setError("Failed to load referral statistics");
        }

        // Handle avatar status
        if (avatarStatus.status === "fulfilled") {
          const avatarData = avatarStatus.value;
          setUserAvatar(avatarData.avatarImageUrl);
          setLoggedInBefore(avatarData.loggedInBefore);

          // Show first-time avatar modal if user hasn't skipped
          if (!avatarData.loggedInBefore) {
            setShowFirstTimeAvatarModal(true);
          }
        } else {
          console.error("Error loading avatar status:", avatarStatus.reason);
          // Don't set error for avatar status, just log it
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    console.log(isAuthenticated, profile, "__isAuthenticated");
    if (isAuthenticated && !!profile) {
      loadUserData();
    }
    // setLoading(false);
    // else if (!authLoading && !user) {
    //   // If auth is done loading and no user, redirect
    //   router.push("/signup");
    // }
  }, [router, isAuthenticated, profile]);

  // Show loading state
  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar variant="dashboard" />

      {/* Position Update Popup */}
      {showPositionUpdatePopup && positionUpdateData && (
        <PositionUpdatePopup
          isVisible={showPositionUpdatePopup}
          oldPosition={positionUpdateData.oldPosition}
          newPosition={positionUpdateData.newPosition}
          isImprovement={positionUpdateData.isImprovement}
          onClose={() => {
            setShowPositionUpdatePopup(false);
            setPositionUpdateData(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Avatar Selection Modal */}
        <AvatarSelectionModal
          isVisible={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          onSave={(selectedAvatar: string) => {
            setUserAvatar(selectedAvatar);
            setShowAvatarModal(false);
          }}
          userId={profile?.id}
          isFirstTime={false}
        />

        {/* First-time avatar modal */}
        <AvatarSelectionModal
          isVisible={showFirstTimeAvatarModal}
          onClose={() => setShowFirstTimeAvatarModal(false)}
          onSave={(selectedAvatar: string) => {
            setUserAvatar(selectedAvatar);
            setLoggedInBefore(true);
            setShowFirstTimeAvatarModal(false);
          }}
          userId={profile?.id}
          isFirstTime={true}
        />

        {/* Welcome Banner */}
        <div className="relative py-[33px] px-[24px] self-stretch w-full bg-[#702cff] rounded-[20px] overflow-hidden bg-cover md:bg-right bg-center flex flex-col gap-5 mb-[31px]">
          <div className="absolute -top-5 -left-[85px] w-fit rotate-90 z-10">
            <CircleIcon fillColor="#9461ff" className="w-[160px] h-[160px]" />
          </div>
          <div className="absolute -bottom-5 -right-[85px] w-fit rotate-90 z-10">
            <CircleIcon fillColor="#9461ff" className="w-[160px] h-[160px]" />
          </div>

          <h1 className="text-white text-3xl font-bold relative z-20">
            Welcome back, {profile.username || profile.email}!
          </h1>
          <p className="text-white text-sm relative z-20">
            Track your referrals and see your position on the waitlist.
          </p>
          <Button
            variant="black"
            className="!rounded-[40px] w-fit !py-[10px] !px-[16px] !text-[16px] relative z-20"
            onClick={() => router.push("/leaderboard")}
          >
            View Leaderboard
            <Image
              className="ml-3 min-w-[26px] min-h-[26px]"
              width={26}
              height={26}
              src={"/btn.svg"}
              alt=""
            />
          </Button>
        </div>

        {/* Avatar Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center max-md:items-start gap-4 max-md:flex-col justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100  outline-2 outline-[#4F46E5]">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="User Avatar"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full "
                    />
                  ) : (
                    <Image
                      src={"/avatars/default-avatar.png"}
                      alt="User Avatar"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                  {profile.username || profile.email}
                </h3>
                <p className="text-sm text-gray-600">
                  {userAvatar ? "Avatar selected" : "No avatar selected"}
                </p>
              </div>
            </div>
            <Button
              variant="purple"
              onClick={() => setShowAvatarModal(true)}
              className="!px-4 !py-2"
            >
              Change Avatar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
              totalReferralsCounter.isAnimating
                ? "ring-2 ring-blue-200 shadow-lg"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="text-[16px] font-medium text-gray-500">
                    Total Referrals
                  </p>
                  <Image
                    className="min-w-[40px] min-h-[40px]"
                    width={40}
                    height={40}
                    src={"/total-referrals.svg"}
                    alt=""
                  />
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {totalReferralsCounter.showOldValue && (
                    <div
                      className={`absolute inset-0 flex items-center transition-all duration-500 ${
                        totalReferralsCounter.isAnimating
                          ? "opacity-0 -translate-y-4 text-blue-400"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      <span className="text-3xl font-bold">
                        {totalReferralsCounter.oldValue}
                      </span>
                    </div>
                  )}

                  {/* New value fading in */}
                  <div
                    className={`transition-all duration-500 ${
                      totalReferralsCounter.isAnimating &&
                      !totalReferralsCounter.showOldValue
                        ? "opacity-100 translate-y-0 text-blue-600 scale-105"
                        : totalReferralsCounter.isAnimating
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    <span className="text-3xl font-bold text-gray-900">
                      {totalReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
              verifiedReferralsCounter.isAnimating
                ? "ring-2 ring-green-200 shadow-lg"
                : ""
            }`}
          >
            <div className="flex items-center">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="text-[16px] font-medium text-gray-500">
                    Verified Referrals
                  </p>
                  <Image
                    className="min-w-[40px] min-h-[40px]"
                    width={40}
                    height={40}
                    src={"/verified-referrals.svg"}
                    alt=""
                  />
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {verifiedReferralsCounter.showOldValue && (
                    <div
                      className={`absolute inset-0 flex items-center transition-all duration-500 ${
                        verifiedReferralsCounter.isAnimating
                          ? "opacity-0 -translate-y-4 text-green-400"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      <span className="text-3xl font-bold">
                        {verifiedReferralsCounter.oldValue}
                      </span>
                    </div>
                  )}

                  {/* New value fading in */}
                  <div
                    className={`transition-all duration-500 ${
                      verifiedReferralsCounter.isAnimating &&
                      !verifiedReferralsCounter.showOldValue
                        ? "opacity-100 translate-y-0 text-green-600 scale-105"
                        : verifiedReferralsCounter.isAnimating
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    <span className="text-3xl font-bold text-gray-900">
                      {verifiedReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
              pendingReferralsCounter.isAnimating
                ? "ring-2 ring-yellow-200 shadow-lg"
                : ""
            }`}
          >
            <div className="flex items-center">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="text-[16px] font-medium text-gray-500">
                    Pending
                  </p>
                  <Image
                    className="min-w-[40px] min-h-[40px]"
                    width={40}
                    height={40}
                    src={"/pending-referrals.svg"}
                    alt=""
                  />
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {pendingReferralsCounter.showOldValue && (
                    <div
                      className={`absolute inset-0 flex items-center transition-all duration-500 ${
                        pendingReferralsCounter.isAnimating
                          ? "opacity-0 -translate-y-4 text-yellow-400"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      <span className="text-3xl font-bold">
                        {pendingReferralsCounter.oldValue}
                      </span>
                    </div>
                  )}

                  {/* New value fading in */}
                  <div
                    className={`transition-all duration-500 ${
                      pendingReferralsCounter.isAnimating &&
                      !pendingReferralsCounter.showOldValue
                        ? "opacity-100 translate-y-0 text-yellow-600 scale-105"
                        : pendingReferralsCounter.isAnimating
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    <span className="text-3xl font-bold text-gray-900">
                      {pendingReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
              conversionRateCounter.isAnimating
                ? "ring-2 ring-purple-200 shadow-lg"
                : ""
            }`}
          >
            <div className="flex items-center">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="text-[16px] font-medium text-gray-500">
                    Conversion Rate
                  </p>
                  <Image
                    className="min-w-[40px] min-h-[40px]"
                    width={40}
                    height={40}
                    src={"/conversion-rate.svg"}
                    alt=""
                  />
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {conversionRateCounter.showOldValue && (
                    <div
                      className={`absolute inset-0 flex items-center transition-all duration-500 ${
                        conversionRateCounter.isAnimating
                          ? "opacity-0 -translate-y-4 text-purple-400"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      <span className="text-3xl font-bold">
                        {conversionRateCounter.oldValue}%
                      </span>
                    </div>
                  )}

                  {/* New value fading in */}
                  <div
                    className={`transition-all duration-500 ${
                      conversionRateCounter.isAnimating &&
                      !conversionRateCounter.showOldValue
                        ? "opacity-100 translate-y-0 text-purple-600 scale-105"
                        : conversionRateCounter.isAnimating
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    <span className="text-3xl font-bold text-gray-900">
                      {conversionRateCounter.displayValue}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Waitlist Position */}
          <WaitlistRank
            position={waitlistPositionCounter.displayValue}
            isAnimating={waitlistPositionCounter.isAnimating}
            showOldValue={waitlistPositionCounter.showOldValue}
            oldValue={waitlistPositionCounter.oldValue}
            userAvatar={userAvatar}
          />

          {/* Referral Card */}
          <ReferralCard
            referralCode={profile.referral_code}
            totalReferrals={userStats?.totalReferrals || 0}
            waitlistPosition={userStats?.waitlistPosition || 0}
            isVerified={userStats?.isVerified || false}
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className=" rounded-lg ">
            <div className="">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="py-6">
              {userStats?.totalReferrals === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No referrals yet
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Start sharing your referral link to see your activity here!
                  </p>
                  <Button variant="primary" onClick={shareReferral}>
                    Share Your Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
                      verifiedReferralsCounter.isAnimating
                        ? "ring-2 ring-green-200 shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Image
                        className="min-w-[40px] min-h-[40px]"
                        width={40}
                        height={40}
                        src={"/verified-referrals.svg"}
                        alt=""
                      />
                      <div className="relative">
                        <div
                          className={`font-medium text-gray-900 transition-all duration-300 ${
                            verifiedReferralsCounter.isAnimating
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            {/* Old value fading up */}
                            {verifiedReferralsCounter.showOldValue && (
                              <div
                                className={`absolute inset-0 transition-all duration-500 ${
                                  verifiedReferralsCounter.isAnimating
                                    ? "opacity-0 -translate-y-2 text-green-400"
                                    : "opacity-100 translate-y-0"
                                }`}
                              >
                                {verifiedReferralsCounter.oldValue} successful
                                referrals
                              </div>
                            )}

                            {/* New value fading in */}
                            <div
                              className={`transition-all duration-500 ${
                                verifiedReferralsCounter.isAnimating &&
                                !verifiedReferralsCounter.showOldValue
                                  ? "opacity-100 translate-y-0"
                                  : verifiedReferralsCounter.isAnimating
                                  ? "opacity-0 translate-y-2"
                                  : "opacity-100 translate-y-0"
                              }`}
                            >
                              {verifiedReferralsCounter.displayValue} successful
                              referrals
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Great job! Keep it up to improve your position.
                        </p>
                      </div>
                    </div>
                  </div>

                  {referralStats && referralStats.pendingReferrals > 0 && (
                    <div
                      className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
                        pendingReferralsCounter.isAnimating
                          ? "ring-2 ring-yellow-200 shadow-lg"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          className="min-w-[40px] min-h-[40px]"
                          width={40}
                          height={40}
                          src={"/pending-referrals.svg"}
                          alt=""
                        />
                        <div className="relative">
                          <div
                            className={`font-medium text-gray-900 transition-all duration-300 ${
                              pendingReferralsCounter.isAnimating
                                ? "text-yellow-600"
                                : ""
                            }`}
                          >
                            <div className="relative">
                              {/* Old value fading up */}
                              {pendingReferralsCounter.showOldValue && (
                                <div
                                  className={`absolute inset-0 transition-all duration-500 ${
                                    pendingReferralsCounter.isAnimating
                                      ? "opacity-0 -translate-y-2 text-yellow-400"
                                      : "opacity-100 translate-y-0"
                                  }`}
                                >
                                  {pendingReferralsCounter.oldValue} pending
                                  referrals
                                </div>
                              )}

                              {/* New value fading in */}
                              <div
                                className={`transition-all duration-500 ${
                                  pendingReferralsCounter.isAnimating &&
                                  !pendingReferralsCounter.showOldValue
                                    ? "opacity-100 translate-y-0"
                                    : pendingReferralsCounter.isAnimating
                                    ? "opacity-0 translate-y-2"
                                    : "opacity-100 translate-y-0"
                                }`}
                              >
                                {pendingReferralsCounter.displayValue} pending
                                referrals
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Waiting for email verification
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
