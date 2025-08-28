import React, { useState } from "react";
import { clsx } from "clsx";
import Button from "./Button";
import Image from "next/image";

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

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ref/${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
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
      textArea.value = referralCode;
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
        "bg-white rounded-xl shadow border border-gray-200 p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Referral Link
        </h3>
        <div
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-medium",
            isVerified
              ? "bg-[#DCFCE7] text-[#16A34A]"
              : "bg-yellow-100 text-yellow-800"
          )}
        >
          {isVerified ? "Verified" : "Pending Verification"}
        </div>
      </div>

      <div className="space-y-6">
        {/* Referral Code Section */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Referral Code
          </label>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">
              {referralCode}
            </div>
            <Button
              variant="light-blue"
              size="sm"
              onClick={copyToClipboard}
              className="!rounded-[18px]  !shadow-none !border-none !text-[#3B82F6] !bg-[#3B82F617] hover:!bg-[#3b83f642]"
            >
              {/* <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
              </svg> */}
              <Image className="w-[14px] h-[14px] mr-2" width={14} height={14} src={"/copy-icon.svg"} alt=""/>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Referral Link Section */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Referral Link
          </label>
          <div className="flex items-center space-x-3 max-sm:flex-col max-sm:gap-3">
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 border border-gray-200 break-all">
              {referralUrl}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={shareReferral}
              className="!bg-[#702DFF] hover:!bg-[#6f2dffc1] !border-none max-sm:w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
              </svg>
              Share
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex justify-center items-center gap-2">
            <div className="text-sm text-gray-500">Total Referrals</div>
            <div className="text-2xl font-bold text-gray-900">{totalReferrals}</div>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="text-sm text-gray-500">Waitlist Position</div>
            <div className="text-2xl font-bold text-gray-900">#{waitlistPosition}</div>
          </div>
        </div>

        {/* Copy Success Message */}
        {showCopiedMessage && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
            Referral code copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralCard;
