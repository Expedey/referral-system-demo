import React, { useState } from "react";
import { clsx } from "clsx";
import Button from "./Button";

export interface ReferralCardProps {
  referralCode: string;
  totalReferrals: number;
  waitlistPosition: number;
  isVerified: boolean;
  className?: string;
}

const ReferralCard: React.FC<ReferralCardProps> = ({
  referralCode,
  totalReferrals,
  waitlistPosition,
  isVerified,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const referralUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/ref/${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setShowCopiedMessage(true);
      setTimeout(() => {
        setShowCopiedMessage(false);
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setShowCopiedMessage(true);
      setTimeout(() => {
        setShowCopiedMessage(false);
        setCopied(false);
      }, 2000);
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join the waitlist!",
          text: `I'm on the waitlist! Use my referral code: ${referralCode}`,
          url: referralUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow-lg border border-gray-200 p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Referral Link
        </h3>
        <div
          className={clsx(
            "px-2 py-1 rounded-full text-xs font-medium",
            isVerified
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          )}
        >
          {isVerified ? "Verified" : "Pending Verification"}
        </div>
      </div>

      <div className="space-y-4">
        {/* Referral Code Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Code
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 font-mono text-sm text-gray-900">
              {referralCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Referral URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Link
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 truncate">
              {referralUrl}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={shareReferral}
              className="whitespace-nowrap"
            >
              Share
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalReferrals}
            </div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              #{waitlistPosition}
            </div>
            <div className="text-sm text-gray-600">Waitlist Position</div>
          </div>
        </div>

        {/* Copy Success Message */}
        {showCopiedMessage && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
            Referral link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralCard;
