import React, { useState, useEffect } from "react";
import Confetti from "./Confetti";

export interface PositionUpdatePopupProps {
  isVisible: boolean;
  oldPosition: number;
  newPosition: number;
  isImprovement: boolean;
  onClose: () => void;
}

const PositionUpdatePopup: React.FC<PositionUpdatePopupProps> = ({
  isVisible,
  oldPosition,
  newPosition,
  isImprovement,
  onClose,
}) => {
  const [showOldPosition, setShowOldPosition] = useState(true);
  const [showNewPosition, setShowNewPosition] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Reset states when popup becomes visible
      setShowOldPosition(true);
      setShowNewPosition(false);

      // Show new position after 2 seconds
      const timer = setTimeout(() => {
        setShowOldPosition(false);
        setShowNewPosition(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Confetti for improvements */}
      <Confetti isActive={isImprovement && isVisible} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full mx-4 transform transition-all duration-300 animate-in zoom-in-95 relative overflow-hidden">
          {/* Purple gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Header with Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
              <span className="text-3xl">
                {isImprovement ? '🎉' : '📊'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-8 text-gray-800">
              {isImprovement ? '🚀 You\'re climbing the ranks!' : '📈 Your position has been updated!'}
            </h3>

            {/* Single Sentence with Position Animation */}
            <div className="mb-8">
              <div className="text-lg text-gray-700 leading-relaxed">
                {isImprovement ? (
                  <>
                    Position upgraded: #{oldPosition.toLocaleString()} →{' '}
                    <span className="relative inline-block">
                      {/* Old Position - Shows immediately */}
                      <div className={`transition-all duration-500 ${showOldPosition ? 'opacity-100' : 'opacity-0 -translate-y-2'}`}>
                        <span className="text-2xl font-bold text-purple-400">
                          #{oldPosition.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* New Position - Fades in after delay */}
                      <div className={`absolute inset-0 transition-all duration-500 ${showNewPosition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          #{newPosition.toLocaleString()}
                        </span>
                      </div>
                    </span>
                  </>
                ) : (
                  <>
                    Current waitlist position: {' '}
                    <span className="relative inline-block">
                      {/* Old Position - Shows immediately */}
                      <div className={`transition-all duration-500 ${showOldPosition ? 'opacity-100' : 'opacity-0 -translate-y-2'}`}>
                        <span className="text-2xl font-bold text-purple-400">
                          #{oldPosition.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* New Position - Fades in after delay */}
                      <div className={`absolute inset-0 transition-all duration-500 ${showNewPosition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          #{newPosition.toLocaleString()}
                        </span>
                      </div>
                    </span>
                  </>
                )}
              </div>
              
              {/* Keep referring message */}
              <div className="mt-4 text-sm text-gray-600">
                {isImprovement ? (
                  <span className="text-purple-600 font-medium">🎯 Keep referring to climb even higher!</span>
                ) : (
                  <span className="text-gray-600">📈 Keep referring to improve your position!</span>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="cursor-pointer w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Got it!
            </button>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200 to-transparent rounded-full translate-y-12 -translate-x-12 opacity-30"></div>
        </div>
      </div>
    </>
  );
};

export default PositionUpdatePopup; 