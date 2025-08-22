'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface EmailDigestData {
  topReferrers: Array<{
    email: string;
    username: string;
    referral_code: string;
    count: number;
  }>;
  totalGrowth: {
    totalUsers: number;
    totalReferrals: number;
    verifiedReferrals: number;
    conversionRate: number;
    weeklyGrowth: number;
  };
  flaggedAccounts: {
    totalFlagged: number;
    weeklyFlagged: number;
    uniqueIPs: number;
  };
  tierBreakdown: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  weekRange: {
    start: string;
    end: string;
  };
}

export default function EmailDigestPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [digestData, setDigestData] = useState<EmailDigestData | null>(null);
  const [teamEmail, setTeamEmail] = useState(process.env.NEXT_PUBLIC_EMAIL_TO || "");
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check authentication
  if (!authLoading && !user) {
    router.push("/admin/login");
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateDigest = async (sendEmail: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // First get the digest data
      const response = await fetch('/api/email-digest/weekly', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to generate digest');
        return;
      }

      setDigestData(result.data);

      // If sendEmail is true, send the email using SendGrid
      if (sendEmail && result.data) {
        try {
          const emailResponse = await fetch('/api/sendEmail/weekly-digest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: "mubashir@expedey.com",
              digestData: result.data
            }),
          });

          const emailResult = await emailResponse.json();

          if (!emailResponse.ok) {
            setError(emailResult.message || 'Failed to send email');
            return;
          }

          setMessage(`Weekly digest sent successfully to ${teamEmail}!`);
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          setError('Failed to send email');
          return;
        }
      } else {
        setMessage('Digest preview generated successfully!');
      }
    } catch (error) {
      console.error('Error generating digest:', error);
      setError('Failed to generate digest');
    } finally {
      setLoading(false);
    }
  };


  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Email Digest</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and send weekly referral statistics to your team
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="teamEmail" className="block text-sm font-medium text-gray-700">
              Team Email Address
            </label>
            <input
              type="email"
              id="teamEmail"
              value={teamEmail}
              onChange={(e) => setTeamEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="team@yourcompany.com"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => generateDigest(false)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Preview Digest'}
            </button>

            <button
              onClick={() => generateDigest(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Digest'}
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Digest Preview */}
      {digestData && (
        <div className="space-y-6">
          {/* Week Range */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              📅 Week Range: {formatDate(digestData.weekRange.start)} - {formatDate(digestData.weekRange.end)}
            </h2>
          </div>

          {/* Total Growth */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">📈 Total Growth</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{digestData.totalGrowth.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{digestData.totalGrowth.totalReferrals.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Referrals</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{digestData.totalGrowth.verifiedReferrals.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Verified Referrals</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{digestData.totalGrowth.conversionRate}%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{digestData.totalGrowth.weeklyGrowth > 0 ? '+' : ''}{digestData.totalGrowth.weeklyGrowth}%</p>
                <p className="text-sm text-gray-600">Weekly Growth</p>
              </div>
            </div>
          </div>

          {/* Flagged Accounts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">🚨 Flagged Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{digestData.flaggedAccounts.totalFlagged.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Flagged</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{digestData.flaggedAccounts.weeklyFlagged.toLocaleString()}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">{digestData.flaggedAccounts.uniqueIPs.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Unique IPs</p>
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">🏆 Top 10 Referrers</h2>
            <div className="space-y-3">
              {digestData.topReferrers.map((referrer, index) => (
                <div key={referrer.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referrer.username}</p>
                      <p className="text-sm text-gray-500">{referrer.email}</p>
                      <p className="text-xs text-gray-400 font-mono">{referrer.referral_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{referrer.count}</p>
                    <p className="text-sm text-gray-500">referrals</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Breakdown
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">💎 Tier Breakdown</h2>
            <div className="space-y-3">
              {digestData.tierBreakdown.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{tier.tier}</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{tier.count} users</p>
                    <p className="text-sm text-gray-500">{tier.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
} 