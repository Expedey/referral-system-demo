"use client";

import React, { useEffect, useState } from "react";
import { ReferralService } from "@/services/referralService";
import { useAuth } from "@/hooks/useAuth";
import { LeaderboardSection } from "@/components/sections/LeaderboardSection"; 
import { TopChampionsSection } from "@/components/sections/TopChampionsSection/TopChampionsSection";
import { TopReferrersSection } from "@/components/sections/TopReferrersSection";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  id: string;
  username: string;
  referral_code: string;
  total_referrals: number;
  rank: number;
}



export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Leaderboard] useEffect: loading leaderboard...");
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await ReferralService.getLeaderboard(50); // Get top 50
      console.log("[Leaderboard] ReferralService.getLeaderboard data:", data);
      setLeaderboard(data);
    } catch (error) {
      console.error("[Leaderboard] Error loading leaderboard:", error);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };




  // Show loading state only if we have no data and are loading
  if (loading && leaderboard.length === 0) {
    return (
      <div className="bg-white flex flex-col items-center w-full min-h-screen">
        <Navbar 
          variant="leaderboard" 
          title="Leaderboard" 
          subtitle="Top referrers on the waitlist"
          showBackButton={true}
          backUrl="/dashboard"
          backButtonText="Back to Dashboard"
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state only if we have no data and there's an error
  if (error && leaderboard.length === 0) {
    return (
      <div className="bg-white flex flex-col items-center w-full min-h-screen">
        <Navbar 
          variant="leaderboard" 
          title="Leaderboard" 
          subtitle="Top referrers on the waitlist"
          showBackButton={true}
          backUrl="/dashboard"
          backButtonText="Back to Dashboard"
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Error loading leaderboard</h4>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Header */}
      <Navbar 
        variant="leaderboard" 
        title="Leaderboard" 
        subtitle="Top referrers on the waitlist"
        showBackButton={true}
        backUrl="/dashboard"
        backButtonText="Back to Dashboard"
      />
      
      <div className="bg-white flex flex-col items-center w-full py-10 px-5 ">
      <div className="bg-white w-full max-w-[1080px] mx-autorelative">
          {/* Main content sections */}
          <div className="flex flex-col w-full">
            {/* Top Champions Section */}
            <div className="w-full mb-8">
              <TopChampionsSection />
            </div>

    

            {/* Top Referrers Section */}
            <div className="w-full my-8">
              <TopReferrersSection leaderboardData={leaderboard} />
            </div>

            {/* Leaderboard Section */}
            <div className="w-full mt-8">
              <LeaderboardSection leaderboardData={leaderboard} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
