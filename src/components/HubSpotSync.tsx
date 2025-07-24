'use client';

import { useState } from 'react';
import Button from './Button';

interface SyncStatus {
  hubspotContactsCount: number;
  recentContacts: Array<{
    email: string;
    referralCount: number;
    lastReferralAt: string;
  }>;
}

interface SyncResults {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function HubSpotSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSyncUsers = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResults(null);

    try {
      const response = await fetch('/api/hubspot/sync-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync users');
      }

      setSyncResults(data.results);
      console.log('Sync completed:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGetStatus = async () => {
    try {
      const response = await fetch('/api/hubspot/sync-users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get sync status');
      }

      setSyncStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Status error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">HubSpot Integration</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={handleSyncUsers}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSyncing ? 'Syncing...' : 'Sync All Users to HubSpot'}
          </Button>
          
          <Button
            onClick={handleGetStatus}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Get Sync Status
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {syncResults && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-semibold text-green-800 mb-2">Sync Results</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total:</span> {syncResults.total}
              </div>
              <div>
                <span className="font-medium">Successful:</span>{' '}
                <span className="text-green-600">{syncResults.successful}</span>
              </div>
              <div>
                <span className="font-medium">Failed:</span>{' '}
                <span className="text-red-600">{syncResults.failed}</span>
              </div>
            </div>
            {syncResults.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-800 mb-1">Errors:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {syncResults.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {syncResults.errors.length > 5 && (
                    <li>• ... and {syncResults.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {syncStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-800 mb-2">HubSpot Status</h3>
            <p className="text-sm text-blue-700 mb-3">
              Total contacts with referrals: {syncStatus.hubspotContactsCount}
            </p>
            
            {syncStatus.recentContacts.length > 0 && (
              <div>
                <p className="font-medium text-blue-800 mb-2">Recent Contacts:</p>
                <div className="space-y-2">
                  {syncStatus.recentContacts.map((contact, index) => (
                    <div key={index} className="text-sm bg-white rounded p-2">
                      <div className="font-medium">{contact.email}</div>
                      <div className="text-gray-600">
                        Referrals: {contact.referralCount} | 
                        Last: {contact.lastReferralAt ? new Date(contact.lastReferralAt).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 