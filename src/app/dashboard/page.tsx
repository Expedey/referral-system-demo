"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import ReferralCard from "@/components/ReferralCard";
import WaitlistRank from "@/components/WaitlistRank";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

// Custom hook for animated counters with fade effects
const useAnimatedCounter = (value: number, duration: number = 1000) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showOldValue, setShowOldValue] = useState(false);
  const [oldValue, setOldValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
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
          const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

          setDisplayValue(currentValue);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setDisplayValue(endValue);
            setIsAnimating(false);
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
  const { user, profile, loading: authLoading } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // Animated counters
  const totalReferralsCounter = useAnimatedCounter(userStats?.totalReferrals || 0);
  const verifiedReferralsCounter = useAnimatedCounter(referralStats?.verifiedReferrals || 0);
  const pendingReferralsCounter = useAnimatedCounter(referralStats?.pendingReferrals || 0);
  const conversionRateCounter = useAnimatedCounter(referralStats?.conversionRate || 0);

  console.log(isRefreshing);
  console.log(showRefreshNotification);

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!user) return;
    
    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Set a new timeout to debounce rapid calls
    const timeout = setTimeout(async () => {
      try {
        setIsRefreshing(true);
        setError(null);
        
        // Load user stats and referral stats in parallel with timeout
        const [stats, refStats] = await Promise.allSettled([
          Promise.race([
            UserService.getUserStats(user.id),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("User stats timeout")), 15000)
            )
          ]),
          Promise.race([
            ReferralService.getReferralStats(user.id),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Referral stats timeout")), 15000)
            )
          ])
        ]);

        // Handle user stats
        if (stats.status === 'fulfilled') {
          setUserStats(stats.value);
        } else {
          console.error("Error loading user stats:", stats.reason);
          setError("Failed to load user statistics");
        }

        // Handle referral stats
        if (refStats.status === 'fulfilled') {
          setReferralStats(refStats.value);
        } else {
          console.error("Error loading referral stats:", refStats.reason);
          setError("Failed to load referral statistics");
        }

        // Show refresh notification if both stats were loaded successfully
        if (stats.status === 'fulfilled' && refStats.status === 'fulfilled') {
          setShowRefreshNotification(true);
          setTimeout(() => setShowRefreshNotification(false), 3000);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        setError("Failed to refresh dashboard data");
      } finally {
        setIsRefreshing(false);
      }
    }, 500); // 500ms debounce

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
      if (!user) return;

      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        
        if (token) {
          supabase.realtime.setAuth(token);
        }

        // Create channel for users table changes (filtered to current user)
        const usersChannel = supabase
          .channel('user-changes')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'users',
            filter: `id=eq.${user.id}`
          }, payload => {
            console.log('User Change:', payload);
            console.log('Refreshing user stats due to user data change');
            // Refresh user stats when user data changes
            refreshUserData();
          })
          .subscribe((status) => {
            console.log('Users channel status:', status);
            if (status === 'CHANNEL_ERROR') {
              console.error('Users channel error occurred');
            }
          });

        // Create channel for referrals table changes (filtered to current user's referrals)
        const referralsChannel = supabase
          .channel('referrals-changes')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'referrals',
            filter: `referrer_id=eq.${user.id}`
          }, payload => {
            console.log('Referral Change:', payload);
            console.log('Refreshing referral stats due to referral data change');
            // Refresh referral stats when referral data changes
            refreshUserData();
          })
          .subscribe((status) => {
            console.log('Referrals channel status:', status);
            if (status === 'CHANNEL_ERROR') {
              console.error('Referrals channel error occurred');
            }
          });

        return () => {
          usersChannel.unsubscribe();
          referralsChannel.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up realtime channels:', error);
      }
    }

    const cleanup = init();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
      // Clean up any pending refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [user]);


  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/signup");
      return;
    }

    if (user && profile) {
      const loadUserData = async () => {
        if (!user) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // Load user stats and referral stats in parallel with timeout
          const [stats, refStats] = await Promise.allSettled([
            Promise.race([
              UserService.getUserStats(user.id),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("User stats timeout")), 8000)
              )
            ]),
            Promise.race([
              ReferralService.getReferralStats(user.id),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("Referral stats timeout")), 8000)
              )
            ])
          ]);

          // Handle user stats
          if (stats.status === 'fulfilled') {
            setUserStats(stats.value);
          } else {
            console.error("Error loading user stats:", stats.reason);
            setError("Failed to load user statistics");
          }

          // Handle referral stats
          if (refStats.status === 'fulfilled') {
            setReferralStats(refStats.value);
          } else {
            console.error("Error loading referral stats:", refStats.reason);
            setError("Failed to load referral statistics");
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          setError("Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    } else if (!authLoading && !user) {
      // If auth is done loading and no user, redirect
      router.push("/signup");
    }
  }, [user, profile, authLoading, router]);

  // Show loading state
  if (authLoading || loading) {
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
        <Navbar variant="dashboard"  />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
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

  if (!user || !profile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar variant="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Refresh Notification */}
        {/* {showRefreshNotification && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Dashboard updated
              </p>
              <p className="text-xs text-green-600">
                Your stats have been refreshed with the latest data
              </p>
            </div>
          </div>
        )} */}

<div className="relative py-[33px] px-[24px] self-stretch w-full  bg-[#702cff] rounded-[20px] overflow-hidden bg-[url('/dashboard-banner.png')] bg-cover md:bg-right bg-center flex flex-col gap-5 mb-[31px] ">
    

   
   <h1 className="text-white text-3xl font-bold">
    Welcome back, {profile.username || profile.email}!
   </h1>
   <p className="text-white text-sm">
    Track your referrals and see your position on the waitlist.
   </p>
   <Button
   variant="black"
   className="!rounded-[40px] w-fit !py-[10px] !px-[16px] !text-[16px]"
   onClick={() => router.push("/leaderboard")}
   >
    View Leaderboard
    <Image className="ml-3 min-w-[26px] min-h-[26px]" width={26} height={26} src={"/btn.svg"} alt=""/>
   </Button>
      </div>

        {/* Welcome Section */}
        {/* <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.username || profile.email}!
              </h2>
              <p className="text-gray-600">
                Track your referrals and see your position on the waitlist.
              </p>
            </div>
         
          </div>
        </div> */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
            totalReferralsCounter.isAnimating ? 'ring-2 ring-blue-200 shadow-lg' : ''
          }`}>
            <div className="flex items-start justify-between">
         
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">

                <p className="text-[16px] font-medium text-gray-500">
                  Total Referrals
                </p>
                <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/total-referrals.svg"} alt=""/>
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {totalReferralsCounter.showOldValue && (
                    <div className={`absolute inset-0 flex items-center transition-all duration-500 ${
                      totalReferralsCounter.isAnimating 
                        ? 'opacity-0 -translate-y-4 text-blue-400' 
                        : 'opacity-100 translate-y-0'
                    }`}>
                      <span className="text-3xl font-bold">{totalReferralsCounter.oldValue}</span>
                    </div>
                  )}
                  
                  {/* New value fading in */}
                  <div className={`transition-all duration-500 ${
                    totalReferralsCounter.isAnimating && !totalReferralsCounter.showOldValue
                      ? 'opacity-100 translate-y-0 text-blue-600 scale-105' 
                      : totalReferralsCounter.isAnimating
                      ? 'opacity-0 translate-y-4'
                      : 'opacity-100 translate-y-0'
                  }`}>
                    <span className="text-3xl font-bold text-gray-900">
                      {totalReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
            verifiedReferralsCounter.isAnimating ? 'ring-2 ring-green-200 shadow-lg' : ''
          }`}>
            <div className="flex items-center">
<div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">

                <p className="text-[16px] font-medium text-gray-500">
                Verified Referrals
                </p>
                <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/verified-referrals.svg"} alt=""/>
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {verifiedReferralsCounter.showOldValue && (
                    <div className={`absolute inset-0 flex items-center transition-all duration-500 ${
                      verifiedReferralsCounter.isAnimating 
                        ? 'opacity-0 -translate-y-4 text-green-400' 
                        : 'opacity-100 translate-y-0'
                    }`}>
                      <span className="text-3xl font-bold">{verifiedReferralsCounter.oldValue}</span>
                    </div>
                  )}
                  
                  {/* New value fading in */}
                  <div className={`transition-all duration-500 ${
                    verifiedReferralsCounter.isAnimating && !verifiedReferralsCounter.showOldValue
                      ? 'opacity-100 translate-y-0 text-green-600 scale-105' 
                      : verifiedReferralsCounter.isAnimating
                      ? 'opacity-0 translate-y-4'
                      : 'opacity-100 translate-y-0'
                  }`}>
                    <span className="text-3xl font-bold text-gray-900">
                      {verifiedReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
            pendingReferralsCounter.isAnimating ? 'ring-2 ring-yellow-200 shadow-lg' : ''
          }`}>
            <div className="flex items-center">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">

                <p className="text-[16px] font-medium text-gray-500">
                Pending
                </p>
                <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/pending-referrals.svg"} alt=""/>
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {pendingReferralsCounter.showOldValue && (
                    <div className={`absolute inset-0 flex items-center transition-all duration-500 ${
                      pendingReferralsCounter.isAnimating 
                        ? 'opacity-0 -translate-y-4 text-yellow-400' 
                        : 'opacity-100 translate-y-0'
                    }`}>
                      <span className="text-3xl font-bold">{pendingReferralsCounter.oldValue}</span>
                    </div>
                  )}
                  
                  {/* New value fading in */}
                  <div className={`transition-all duration-500 ${
                    pendingReferralsCounter.isAnimating && !pendingReferralsCounter.showOldValue
                      ? 'opacity-100 translate-y-0 text-yellow-600 scale-105' 
                      : pendingReferralsCounter.isAnimating
                      ? 'opacity-0 translate-y-4'
                      : 'opacity-100 translate-y-0'
                  }`}>
                    <span className="text-3xl font-bold text-gray-900">
                      {pendingReferralsCounter.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${
            conversionRateCounter.isAnimating ? 'ring-2 ring-purple-200 shadow-lg' : ''
          }`}>
            <div className="flex items-center">
                <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between gap-2 w-full">

                <p className="text-[16px] font-medium text-gray-500">
                Conversion Rate
                </p>
                <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/conversion-rate.svg"} alt=""/>
                </div>
                <div className="relative h-12 flex items-center">
                  {/* Old value fading up */}
                  {conversionRateCounter.showOldValue && (
                    <div className={`absolute inset-0 flex items-center transition-all duration-500 ${
                      conversionRateCounter.isAnimating 
                        ? 'opacity-0 -translate-y-4 text-purple-400' 
                        : 'opacity-100 translate-y-0'
                    }`}>
                      <span className="text-3xl font-bold">{conversionRateCounter.oldValue}%</span>
                    </div>
                  )}
                  
                  {/* New value fading in */}
                  <div className={`transition-all duration-500 ${
                    conversionRateCounter.isAnimating && !conversionRateCounter.showOldValue
                      ? 'opacity-100 translate-y-0 text-purple-600 scale-105' 
                      : conversionRateCounter.isAnimating
                      ? 'opacity-0 translate-y-4'
                      : 'opacity-100 translate-y-0'
                  }`}>
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
            position={userStats?.waitlistPosition || 0}
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
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Scroll to referral card
                      document
                        .querySelector("[data-referral-card]")
                        ?.scrollIntoView({
                          behavior: "smooth",
                        });
                    }}
                  >
                    Share Your Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
                    verifiedReferralsCounter.isAnimating ? 'ring-2 ring-green-200 shadow-lg' : ''
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/verified-referrals.svg"} alt=""/>
                      <div className="relative">
                        <div className={`font-medium text-gray-900 transition-all duration-300 ${
                          verifiedReferralsCounter.isAnimating ? 'text-green-600' : ''
                        }`}>
                          <div className="relative">
                            {/* Old value fading up */}
                            {verifiedReferralsCounter.showOldValue && (
                              <div className={`absolute inset-0 transition-all duration-500 ${
                                verifiedReferralsCounter.isAnimating 
                                  ? 'opacity-0 -translate-y-2 text-green-400' 
                                  : 'opacity-100 translate-y-0'
                              }`}>
                                {verifiedReferralsCounter.oldValue} successful referrals
                              </div>
                            )}
                            
                            {/* New value fading in */}
                            <div className={`transition-all duration-500 ${
                              verifiedReferralsCounter.isAnimating && !verifiedReferralsCounter.showOldValue
                                ? 'opacity-100 translate-y-0' 
                                : verifiedReferralsCounter.isAnimating
                                ? 'opacity-0 translate-y-2'
                                : 'opacity-100 translate-y-0'
                            }`}>
                              {verifiedReferralsCounter.displayValue} successful referrals
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
                    <div className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
                      pendingReferralsCounter.isAnimating ? 'ring-2 ring-yellow-200 shadow-lg' : ''
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Image className="min-w-[40px] min-h-[40px]" width={40} height={40} src={"/pending-referrals.svg"} alt=""/>
                        <div className="relative">
                          <div className={`font-medium text-gray-900 transition-all duration-300 ${
                            pendingReferralsCounter.isAnimating ? 'text-yellow-600' : ''
                          }`}>
                            <div className="relative">
                              {/* Old value fading up */}
                              {pendingReferralsCounter.showOldValue && (
                                <div className={`absolute inset-0 transition-all duration-500 ${
                                  pendingReferralsCounter.isAnimating 
                                    ? 'opacity-0 -translate-y-2 text-yellow-400' 
                                    : 'opacity-100 translate-y-0'
                                }`}>
                                  {pendingReferralsCounter.oldValue} pending referrals
                                </div>
                              )}
                              
                              {/* New value fading in */}
                              <div className={`transition-all duration-500 ${
                                pendingReferralsCounter.isAnimating && !pendingReferralsCounter.showOldValue
                                  ? 'opacity-100 translate-y-0' 
                                  : pendingReferralsCounter.isAnimating
                                  ? 'opacity-0 translate-y-2'
                                  : 'opacity-100 translate-y-0'
                              }`}>
                                {pendingReferralsCounter.displayValue} pending referrals
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
