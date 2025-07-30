"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import { supabase } from "@/lib/supabase";
import ReferralCard from "@/components/ReferralCard";
import WaitlistRank from "@/components/WaitlistRank";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";

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
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/signup");
      return;
    }
    console.log("user", user);
    console.log("profile", profile);
    if (user && profile) {
      const loadUserData = async () => {
        if (!user) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // Initial fetch of user stats and referral stats
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

      // Subscribe to real-time changes for users table
      const usersChannel = supabase
        .channel(`realtime:users:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT | UPDATE | DELETE
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Users realtime update:', payload);
            if (payload.eventType === 'UPDATE') {
              // Refresh user stats when user data changes
              try {
                const newStats = await UserService.getUserStats(user.id);
                setUserStats(newStats);
                console.log('Updated user stats:', newStats);
              } catch (error) {
                console.error("Error updating user stats:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Users channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setRealtimeStatus('disconnected');
          }
        });

      // Subscribe to real-time changes for referrals table
      const referralsChannel = supabase
        .channel(`realtime:referrals:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT | UPDATE | DELETE
            schema: 'public',
            table: 'referrals',
            filter: `referred_by=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Referrals realtime update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              // Refresh referral stats when referrals change
              try {
                const newRefStats = await ReferralService.getReferralStats(user.id);
                setReferralStats(newRefStats);
                setLastUpdate(new Date());
                console.log('Updated referral stats:', newRefStats);
              } catch (error) {
                console.error("Error updating referral stats:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Referrals channel subscription status:', status);
        });

      // Subscribe to real-time changes for leaderboard table
      const leaderboardChannel = supabase
        .channel(`realtime:leaderboard:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT | UPDATE | DELETE
            schema: 'public',
            table: 'leaderboard',
            filter: `id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Leaderboard realtime update:', payload);
            if (payload.eventType === 'UPDATE') {
              // Refresh user stats when leaderboard position changes
              try {
                const newStats = await UserService.getUserStats(user.id);
                setUserStats(newStats);
                setLastUpdate(new Date());
                console.log('Updated user stats from leaderboard:', newStats);
              } catch (error) {
                console.error("Error updating user stats:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Leaderboard channel subscription status:', status);
        });

      // Also subscribe to all referrals to see when new users sign up
      const allReferralsChannel = supabase
        .channel(`realtime:all-referrals:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'referrals',
          },
          async (payload) => {
            console.log('New referral created:', payload);
            // Check if this referral is for the current user
            if (payload.new && payload.new.referred_by === user.id) {
              console.log('New referral for current user detected!');
              // Refresh both user stats and referral stats
              try {
                const [newStats, newRefStats] = await Promise.all([
                  UserService.getUserStats(user.id),
                  ReferralService.getReferralStats(user.id)
                ]);
                setUserStats(newStats);
                setReferralStats(newRefStats);
                setLastUpdate(new Date());
                console.log('Updated stats after new referral:', { newStats, newRefStats });
              } catch (error) {
                console.error("Error updating stats after new referral:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('All referrals channel subscription status:', status);
        });

      return () => {
        console.log('Cleaning up real-time subscriptions');
        supabase.removeChannel(usersChannel);
        supabase.removeChannel(referralsChannel);
        supabase.removeChannel(leaderboardChannel);
        supabase.removeChannel(allReferralsChannel);
      };
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
        <Navbar variant="dashboard" title="Dashboard" />
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
      <Navbar variant="dashboard" title="Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.username || profile.email}!
              </h2>
              <p className="text-gray-600">
                Track your referrals and see your position on the waitlist.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                realtimeStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : realtimeStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse' 
                    : realtimeStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}></div>
                <span>
                  {realtimeStatus === 'connected' 
                    ? 'Live Updates' 
                    : realtimeStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Offline'
                  }
                </span>
              </div>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {userStats?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Verified Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.verifiedReferrals || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.pendingReferrals || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.conversionRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Waitlist Position */}
          <WaitlistRank
            position={userStats?.waitlistPosition || 0}
            className="h-fit"
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
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
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✅</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {referralStats?.verifiedReferrals || 0} successful
                          referrals
                        </p>
                        <p className="text-sm text-gray-600">
                          Great job! Keep it up to improve your position.
                        </p>
                      </div>
                    </div>
                  </div>

                  {referralStats && referralStats.pendingReferrals > 0 && (
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-sm">⏳</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referralStats.pendingReferrals} pending referrals
                          </p>
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

      {/* Test Section - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              🧪 Real-time Test (Development Only)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-yellow-700">
                  Real-time Status: <strong>{realtimeStatus}</strong>
                </span>
                <span className="text-sm text-yellow-700">
                  Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="text-sm text-yellow-600">
                <p>• Total Referrals: {userStats?.totalReferrals || 0}</p>
                <p>• Verified Referrals: {referralStats?.verifiedReferrals || 0}</p>
                <p>• Pending Referrals: {referralStats?.pendingReferrals || 0}</p>
                <p>• Waitlist Position: {userStats?.waitlistPosition || 0}</p>
              </div>
              <p className="text-xs text-yellow-500">
                To test real-time: Open another browser tab and sign up with your referral link, 
                or manually insert a referral record in Supabase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
