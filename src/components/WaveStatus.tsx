'use client';

import React, { useState, useEffect } from 'react';
import { WaveService, Wave } from '@/services/waveService';

interface WaveStatusProps {
  userId: string;
  className?: string;
}

export default function WaveStatus({ userId, className = '' }: WaveStatusProps) {
  const [wave, setWave] = useState<Wave | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWaveInfo = async () => {
      try {
        const [waveData, accessData] = await Promise.all([
          WaveService.getUserWave(userId),
          WaveService.userHasAccess(userId)
        ]);
        
        setWave(waveData);
        setHasAccess(accessData);
      } catch (error) {
        console.error('Error loading wave info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWaveInfo();
  }, [userId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!wave) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No wave assigned
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium text-gray-900">
          {wave.name}
        </span>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          hasAccess
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {hasAccess ? 'Access Granted' : 'Pending Access'}
        </span>
      </div>
      {wave.description && (
        <span className="text-xs text-gray-500">
          ({wave.description})
        </span>
      )}
    </div>
  );
} 