"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import { isValidReferralCode } from "@/utils/generateReferralCode";
import { storeReferralCode } from "@/utils/parseReferral";
import Button from "@/components/Button";

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{
    username?: string;
    referralCode: string;
    totalReferrals: number;
  } | null>(null);

  useEffect(() => {
    const handleReferral = async () => {
      const referralCode = params.code as string;

      if (!referralCode || !isValidReferralCode(referralCode)) {
        setError("Invalid referral code");
        setLoading(false);
        return;
      }

      try {
        // Get referrer information
        const referrer = await UserService.getUserByReferralCode(referralCode);

        if (!referrer) {
          setError("Referral code not found");
          setLoading(false);
          return;
        }

        // Store referrer_id in localStorage for use during signup
        localStorage.setItem("referrer_id", referrer.id);

        // Get referrer stats
        const stats = await UserService.getUserStats(referrer.id);

        setReferrerInfo({
          username: referrer.username,
          referralCode: referrer.referral_code,
          totalReferrals: stats.totalReferrals,
        });

        // Store referral code for signup
        storeReferralCode(referralCode);

        // Track the visit (optional analytics)
        await ReferralService.trackReferralVisit(referralCode);

        setLoading(false);
      } catch (error) {
        console.error("Error handling referral:", error);
        setError("Failed to load referral information");
        setLoading(false);
      }
    };

    handleReferral();
  }, [params.code]);

  const handleJoinWaitlist = () => {
    router.push("/signup");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Invalid Referral Link
            </h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Link href="/signup">
              <Button variant="primary">Join Waitlist Anyway</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You&apos;ve Been Invited! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Join the exclusive waitlist and get early access
          </p>
        </div>

        {/* Referrer Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">👋</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {referrerInfo?.username || "A friend"} invited you!
            </h2>

            <p className="text-gray-600 mb-6">
              They&apos;re already on the waitlist and want you to join them.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Referral Code</p>
              <p className="font-mono text-lg font-bold text-blue-600">
                {referrerInfo?.referralCode}
              </p>
            </div>

            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {referrerInfo?.totalReferrals || 0}
                </div>
                <div className="text-sm text-gray-600">
                  Successful Referrals
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Why Join the Waitlist?
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">🚀</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Early Access</h4>
                <p className="text-sm text-gray-600">
                  Be among the first to try our new features
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">🎁</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Exclusive Perks</h4>
                <p className="text-sm text-gray-600">
                  Special benefits for early adopters
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm">📈</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Priority Support</h4>
                <p className="text-sm text-gray-600">
                  Get help faster with dedicated support
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-sm">💎</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">VIP Status</h4>
                <p className="text-sm text-gray-600">
                  Access to premium features and content
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleJoinWaitlist}
            className="text-lg px-8 py-4"
          >
            Join the Waitlist Now
          </Button>

          <p className="mt-4 text-sm text-gray-600">
            It only takes 30 seconds to sign up
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
