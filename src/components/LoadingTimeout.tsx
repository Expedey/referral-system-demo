"use client";

import React, { useState, useEffect } from 'react';

interface LoadingTimeoutProps {
  children: React.ReactNode;
  timeout?: number; // milliseconds
  fallback?: React.ReactNode;
  onTimeout?: () => void;
}

export default function LoadingTimeout({ 
  children, 
  timeout = 15000, // 15 seconds default
  fallback,
  onTimeout 
}: LoadingTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout?.();
      console.warn('Loading timeout reached');
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading is taking longer than expected</h2>
          <p className="text-gray-600 mb-6">
            The page is taking longer than usual to load. This might be due to a slow connection or server issues.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 