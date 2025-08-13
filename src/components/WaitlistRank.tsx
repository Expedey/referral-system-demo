import React from "react";
import { clsx } from "clsx";
import Image from "next/image";

export interface WaitlistRankProps {
  position: number;
  totalUsers?: number;
  className?: string;
  isAnimating?: boolean;
  showOldValue?: boolean;
  oldValue?: number;
}

const WaitlistRank: React.FC<WaitlistRankProps> = ({
  position,
  totalUsers,
  className,
  isAnimating = false,
  showOldValue = false,
  oldValue = 0,
}) => {
  // Calculate progress percentage (assuming top 1000 get priority access)
  const maxPosition = 1000;
  const progress = Math.min((position / maxPosition) * 100, 100);

  // Determine status based on position
  const getStatusInfo = () => {
    if (position <= 10) {
      return {
        status: "Elite",
        color: "bg-purple-500 text-white",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      };
    } else if (position <= 50) {
      return {
        status: "VIP",
        color: "bg-blue-500 text-white",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    } else if (position <= 100) {
      return {
        status: "Early Access",
        color: "bg-green-500 text-white",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    } else if (position <= 500) {
      return {
        status: "Priority",
        color: "bg-yellow-500 text-white",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    } else {
      return {
        status: "Standard",
        color: "bg-gray-500 text-white",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow border border-gray-200 p-6",
        className,
        isAnimating ? 'ring-2 ring-blue-200 shadow-lg' : ''
      )}
    >
      <div className="flex flex-col gap-4 justify-between">
        <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Waitlist Position
        </h3>

        {/* Position Display with Avatar */}
        <div className="flex items-center mb-6">
          {/* Circular Avatar */}
          {/* <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl mr-4">
            😊
          </div>
           */}
           <Image className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mr-4" width={48} height={48} src={"/waitlist-avatar.svg"} alt=""/>
          {/* Rank and Status */}
          <div className="flex items-center gap-3">
            <div className="relative h-12 flex items-center">
              {/* Old value fading up */}
              {showOldValue && (
                <div className={`absolute inset-0 flex items-center transition-all duration-500 ${
                  isAnimating 
                    ? 'opacity-0 -translate-y-4 text-blue-400' 
                    : 'opacity-100 translate-y-0'
                }`}>
                  <span className="text-[34px] font-bold text-[#4F46E5]">#{oldValue.toLocaleString()}</span>
                </div>
              )}
              
              {/* New value fading in */}
              <div className={`transition-all duration-500 ${
                isAnimating && !showOldValue
                  ? 'opacity-100 translate-y-0 text-[#4F46E5] scale-105' 
                  : isAnimating
                  ? 'opacity-0 translate-y-4'
                  : 'opacity-100 translate-y-0'
              }`}>
                <span className="text-[34px] font-bold text-[#4F46E5]">
                  #{position.toLocaleString()}
                </span>
              </div>
            </div>
            <div
              className={clsx(
                "inline-block px-3 py-[1px] rounded-full text-sm font-medium",
                position <= 10 ? "bg-[#702DFF33] text-[#702DFF]" : statusInfo.color
              )}
            >
              {statusInfo.status}
            </div>
          </div>
        </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Position</span>
            <span>{Math.round(progress)}% To Priority Access</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={clsx(
                "h-2 rounded-full transition-all duration-500",
                position <= 10
                  ? "bg-[#702DFF]"
                  : position <= 50
                  ? "bg-blue-500"
                  : position <= 100
                  ? "bg-green-500"
                  : position <= 500
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div>

        {/* Early Access Message */}
        {position <= 10 && (
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <div className="text-xl">🎉</div>
            <p className="text-sm text-gray-700 font-medium">
              You&apos;re in the top 10! Early access guaranteed.
            </p>
          </div>
        )}

        {/* Additional Info for other positions */}
        {position > 10 && (
          <div className="text-sm text-gray-600 space-y-1">
            {position <= 50 && (
              <p className="text-blue-600 font-medium">
                🚀 VIP status! You&apos;ll get access in the first wave.
              </p>
            )}
            {position > 50 && position <= 100 && (
              <p className="text-green-600 font-medium">
                ⚡ Early access! You&apos;re in the priority queue.
              </p>
            )}
            {position > 100 && position <= 500 && (
              <p className="text-yellow-600 font-medium">
                📈 Good position! Keep referring to move up faster.
              </p>
            )}
            {position > 500 && (
              <p className="text-gray-600">
                📊 Keep sharing your referral link to improve your position!
              </p>
            )}
          </div>
        )}

        {/* Total Users (if available) */}
        {totalUsers && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {totalUsers.toLocaleString()} total users on waitlist
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistRank;
