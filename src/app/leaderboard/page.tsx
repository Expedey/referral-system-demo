"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ReferralService } from "@/services/referralService";
import Button from "@/components/Button";

interface LeaderboardEntry {
  id: string;
  username: string;
  referral_code: string;
  total_referrals: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Leaderboard] useEffect: loading leaderboard...");
    loadLeaderboard();
  }, []);

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

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-yellow-900 font-bold text-sm">🥇</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-700 font-bold text-sm">🥈</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
          <span className="text-amber-100 font-bold text-sm">🥉</span>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-bold text-sm">{rank}</span>
        </div>
      );
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-500";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
    if (rank === 3) return "bg-gradient-to-r from-amber-500 to-amber-600";
    if (rank <= 10) return "bg-gradient-to-r from-blue-500 to-blue-600";
    if (rank <= 25) return "bg-gradient-to-r from-green-500 to-green-600";
    return "bg-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600">Top referrers on the waitlist</p>
            </div>

            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">🏆 Top Referrers</h2>
            <p className="text-blue-100">
              See who&apos;s leading the pack and get inspired to climb the
              ranks!
            </p>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              variant="primary"
              onClick={loadLeaderboard}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  🏅 Top 3 Champions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {/* 2nd Place */}
                  <div className="order-2 md:order-1">
                    <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl p-6 text-center transform -translate-y-4">
                      <div className="text-4xl mb-2">🥈</div>
                      <h4 className="text-lg font-bold text-gray-800 mb-1">
                        {leaderboard[1]?.username || "Anonymous"}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">
                        {leaderboard[1]?.total_referrals || 0} referrals
                      </p>
                      <div className="bg-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                        #{leaderboard[1]?.rank || 2}
                      </div>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="order-1 md:order-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 text-center transform -translate-y-8">
                      <div className="text-4xl mb-2">👑</div>
                      <h4 className="text-lg font-bold text-yellow-900 mb-1">
                        {leaderboard[0]?.username || "Anonymous"}
                      </h4>
                      <p className="text-yellow-800 text-sm mb-2">
                        {leaderboard[0]?.total_referrals || 0} referrals
                      </p>
                      <div className="bg-yellow-200 rounded-full px-3 py-1 text-xs font-medium text-yellow-800">
                        #{leaderboard[0]?.rank || 1}
                      </div>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-center transform -translate-y-2">
                      <div className="text-4xl mb-2">🥉</div>
                      <h4 className="text-lg font-bold text-amber-100 mb-1">
                        {leaderboard[2]?.username || "Anonymous"}
                      </h4>
                      <p className="text-amber-200 text-sm mb-2">
                        {leaderboard[2]?.total_referrals || 0} referrals
                      </p>
                      <div className="bg-amber-400 rounded-full px-3 py-1 text-xs font-medium text-amber-900">
                        #{leaderboard[2]?.rank || 3}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complete Rankings
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No data yet
                    </h4>
                    <p className="text-gray-600">
                      Be the first to start referring and climb to the top!
                    </p>
                  </div>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${getRankColor(
                        entry.rank
                      )} ${entry.rank <= 3 ? "text-white" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getRankBadge(entry.rank)}

                          <div>
                            <h4
                              className={`font-semibold ${
                                entry.rank <= 3 ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {entry.username || "Anonymous"}
                            </h4>
                            <p
                              className={`text-sm ${
                                entry.rank <= 3
                                  ? "text-gray-100"
                                  : "text-gray-600"
                              }`}
                            >
                              Referral code:{" "}
                              <span className="font-mono">
                                {entry.referral_code}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              entry.rank <= 3 ? "text-white" : "text-blue-600"
                            }`}
                          >
                            {entry.total_referrals}
                          </div>
                          <div
                            className={`text-sm ${
                              entry.rank <= 3
                                ? "text-gray-100"
                                : "text-gray-600"
                            }`}
                          >
                            referrals
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center">
              <div className="bg-blue-50 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Want to climb the leaderboard?
                </h3>
                <p className="text-gray-600 mb-6">
                  Start sharing your referral link and earn your spot at the
                  top!
                </p>
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
