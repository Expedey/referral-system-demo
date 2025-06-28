"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import ReferralCard from "@/components/ReferralCard";
import WaitlistRank from "@/components/WaitlistRank";
import Button from "@/components/Button";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [userStats, setUserStats] = useState<{
    totalReferrals: number;
    waitlistPosition: number;
    isVerified: boolean;
  } | null>(null);
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    validReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/signup");
      return;
    }

    if (user && profile) {
      loadUserData();
    }
  }, [user, profile, authLoading, router]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user stats
      const stats = await UserService.getUserStats(user.id);
      setUserStats(stats);

      // Load referral stats
      const refStats = await ReferralService.getReferralStats(user.id);
      setReferralStats(refStats);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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

  if (!user || !profile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {profile.username || "User"}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/leaderboard">
                <Button variant="outline" size="sm">
                  View Leaderboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.username || profile.email}!
          </h2>
          <p className="text-gray-600">
            Track your referrals and see your position on the waitlist.
          </p>
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
                  Valid Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.validReferrals || 0}
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
                          {referralStats?.validReferrals || 0} successful
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
    </div>
  );
}
