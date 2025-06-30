import React from "react";
import { clsx } from "clsx";

export interface WaitlistRankProps {
  position: number;
  totalUsers?: number;
  className?: string;
}

const WaitlistRank: React.FC<WaitlistRankProps> = ({
  position,
  totalUsers,
  className,
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
        "bg-white rounded-xl shadow-lg border p-6",
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Waitlist Position
        </h3>

        {/* Position Display */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            #{position.toLocaleString()}
          </div>
          <div
            className={clsx(
              "inline-block px-3 py-1 rounded-full text-sm font-medium",
              statusInfo.color
            )}
          >
            {statusInfo.status}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Position</span>
            <span>{Math.round(progress)}% to priority access</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={clsx(
                "h-2 rounded-full transition-all duration-500",
                position <= 10
                  ? "bg-purple-500"
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

        {/* Additional Info */}
        <div className="text-sm text-gray-600 space-y-1">
          {position <= 10 && (
            <p className="text-purple-600 font-medium">
              🎉 You&apos;re in the top 10! Early access guaranteed.
            </p>
          )}
          {position > 10 && position <= 50 && (
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
  );
};

export default WaitlistRank;
