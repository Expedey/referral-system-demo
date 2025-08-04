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

      // If sendEmail is true, send the email using our email API
      if (sendEmail && result.data) {
        const emailContent = generateEmailContent(result.data);
        
        const emailResponse = await fetch('/api/sendEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: teamEmail,
            subject: `Weekly Bonbon Waitlist Digest - ${formatDate(result.data.weekRange.start)}`,
            text: emailContent.text,
            html: emailContent.html,
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          setError(emailResult.message || 'Failed to send email');
          return;
        }

        setMessage(`Weekly digest sent successfully to ${teamEmail}!`);
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

  const generateEmailContent = (data: EmailDigestData) => {
    const text = `
Weekly Bonbon Waitlist Digest
Week: ${formatDate(data.weekRange.start)} - ${formatDate(data.weekRange.end)}

🏆 Top Referrers:
${data.topReferrers.map((r, i) => `${i + 1}. ${r.username} (${r.email}) - ${r.count} referrals`).join('\n')}

📈 Total Growth:
- Total Users: ${data.totalGrowth.totalUsers.toLocaleString()}
- Total Referrals: ${data.totalGrowth.totalReferrals.toLocaleString()}
- Verified Referrals: ${data.totalGrowth.verifiedReferrals.toLocaleString()}
- Conversion Rate: ${data.totalGrowth.conversionRate}%
- Weekly Growth: ${data.totalGrowth.weeklyGrowth}%

🚨 Flagged Accounts:
- Total Flagged: ${data.flaggedAccounts.totalFlagged}
- This Week: ${data.flaggedAccounts.weeklyFlagged}
- Unique IPs: ${data.flaggedAccounts.uniqueIPs}

💎 Tier Breakdown:
${data.tierBreakdown.map(t => `${t.tier}: ${t.count} users (${t.percentage}%)`).join('\n')}
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9FAFB; padding: 24px;">
  <h1 style="color: #4F46E5; text-align: center; margin-bottom: 32px; font-size: 28px; border-bottom: 2px solid #E5E7EB; padding-bottom: 16px;">Weekly Bonbon Waitlist Digest</h1>
  <p style="color: #6B7280; text-align: center; margin-bottom: 32px; font-size: 16px;">Week: ${formatDate(data.weekRange.start)} - ${formatDate(data.weekRange.end)}</p>

  <div style="background-color: white; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #4F46E5; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">🏆 Top Referrers</h2>
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
      <tbody>
        ${data.topReferrers.map((r, i) => `
          <tr>
            <td style="padding: 0 4px;">
              <div style="background: #F3F4F6; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="margin-right: 8px; color: #4F46E5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">${i + 1}</div>
                  <div style="min-width: 0; flex: 1;">
                    <div style="color: #111827; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.username}</div>
                    <div style="color: #6B7280; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.email}</div>
                    <div style="color: #4F46E5; font-weight: 600; font-size: 14px; margin-top: 4px;">${r.count} referrals</div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div style="background-color: white; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #4F46E5; margin-bottom: 20px; font-size: 20px;">📈 Total Growth</h2>
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 4px;">
      <tbody>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #EEF2FF, #E0E7FF); border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 4px;">${data.totalGrowth.totalUsers.toLocaleString()}</div>
            <div style="color: #6B7280; font-size: 14px;">Total Users</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #ECFDF5, #D1FAE5); border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 4px;">${data.totalGrowth.totalReferrals.toLocaleString()}</div>
            <div style="color: #6B7280; font-size: 14px;">Total Referrals</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #FEF3C7, #FDE68A); border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 24px; font-weight: bold; color: #D97706; margin-bottom: 4px;">${data.totalGrowth.verifiedReferrals.toLocaleString()}</div>
            <div style="color: #6B7280; font-size: 14px;">Verified Referrals</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #F3E8FF, #E9D5FF); border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 24px; font-weight: bold; color: #7C3AED; margin-bottom: 4px;">${data.totalGrowth.conversionRate}%</div>
            <div style="color: #6B7280; font-size: 14px;">Conversion Rate</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #EEF2FF, #E0E7FF); border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 4px;">${data.totalGrowth.weeklyGrowth > 0 ? '+' : ''}${data.totalGrowth.weeklyGrowth}%</div>
            <div style="color: #6B7280; font-size: 14px;">Weekly Growth</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="background-color: white; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #4F46E5; margin-bottom: 20px; font-size: 20px;">🚨 Flagged Accounts</h2>
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 4px;">
      <tbody>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #FEE2E2, #FECACA); border-radius: 8px; text-align: center; border: 1px solid #FCA5A5;">
            <div style="font-size: 24px; font-weight: bold; color: #DC2626; margin-bottom: 4px;">${data.flaggedAccounts.totalFlagged}</div>
            <div style="color: #6B7280; font-size: 14px;">Total Flagged</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #FFF7ED, #FFEDD5); border-radius: 8px; text-align: center; border: 1px solid #FDBA74;">
            <div style="font-size: 24px; font-weight: bold; color: #EA580C; margin-bottom: 4px;">${data.flaggedAccounts.weeklyFlagged}</div>
            <div style="color: #6B7280; font-size: 14px;">This Week</div>
          </td>
        </tr>
        <tr>
          <td style="width: 100%; padding: 12px; background: linear-gradient(to bottom right, #FCE7F3, #FBCFE8); border-radius: 8px; text-align: center; border: 1px solid #F9A8D4;">
            <div style="font-size: 24px; font-weight: bold; color: #BE185D; margin-bottom: 4px;">${data.flaggedAccounts.uniqueIPs}</div>
            <div style="color: #6B7280; font-size: 14px;">Unique IPs</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;

    return { text, html };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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