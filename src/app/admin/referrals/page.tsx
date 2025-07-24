'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string;
  status: 'pending' | 'verified' | 'cancelled';
  created_at: string;
  updated_at: string;
  referrer: {
    email: string;
    username: string;
    referral_code: string;
  };
  referred_user: {
    email: string;
    username: string;
  } | null;
}

interface ReferralStats {
  total: number;
  pending: number;
  verified: number;
  cancelled: number;
  conversionRate: number;
  topReferrers: Array<{
    email: string;
    username: string;
    referral_code: string;
    count: number;
  }>;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    verified: 0,
    cancelled: 0,
    conversionRate: 0,
    topReferrers: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'updated_at'>('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    filterAndSortReferrals();
  }, [referrals, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      // Fetch referrals with referrer and referred user data
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:users!referrals_referrer_id_fkey(email, username, referral_code),
          referred_user:users!referrals_referred_user_id_fkey(email, username)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      setReferrals(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (referralData: Referral[]) => {
    const total = referralData.length;
    const pending = referralData.filter(r => r.status === 'pending').length;
    const verified = referralData.filter(r => r.status === 'verified').length;
    const cancelled = referralData.filter(r => r.status === 'cancelled').length;
    const conversionRate = total > 0 ? (verified / total) * 100 : 0;

    // Calculate top referrers
    const referrerCounts = referralData.reduce((acc, referral) => {
      const referrerEmail = referral.referrer.email;
      acc[referrerEmail] = (acc[referrerEmail] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReferrers = Object.entries(referrerCounts)
      .map(([email, count]) => {
        const referral = referralData.find(r => r.referrer.email === email);
        return {
          email,
          username: referral?.referrer.username || '',
          referral_code: referral?.referrer.referral_code || '',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats({
      total,
      pending,
      verified,
      cancelled,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topReferrers,
    });
  };

  const filterAndSortReferrals = () => {
    let filtered = referrals;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(referral => referral.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(referral =>
        referral.referrer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referrer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referred_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referrer.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReferrals(filtered);
  };

  const exportReferrals = () => {
    const csvContent = [
      ['Referrer', 'Referred Email', 'Status', 'Created Date', 'Updated Date'],
      ...filteredReferrals.map(referral => [
        referral.referrer.email,
        referral.referred_email,
        referral.status,
        new Date(referral.created_at).toLocaleDateString(),
        new Date(referral.updated_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, subtitle, color }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && <dd className="text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track referral performance and conversions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={exportReferrals} className="bg-purple-600 hover:bg-purple-700">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Referrals"
          value={stats.total.toLocaleString()}
          color="bg-blue-500"
        />
        <StatCard
          title="Verified Referrals"
          value={stats.verified.toLocaleString()}
          subtitle={`${stats.conversionRate}% conversion rate`}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Referrals"
          value={stats.pending.toLocaleString()}
          color="bg-yellow-500"
        />
        <StatCard
          title="Cancelled Referrals"
          value={stats.cancelled.toLocaleString()}
          color="bg-red-500"
        />
      </div>

      {/* Top Referrers */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Referrers
          </h3>
          {stats.topReferrers.length > 0 ? (
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.topReferrers.map((referrer, index) => (
                  <li key={referrer.email} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {referrer.username || 'No username'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{referrer.email}</p>
                        <p className="text-xs text-gray-400 font-mono">{referrer.referral_code}</p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        <span className="font-medium">{referrer.count}</span> referrals
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No referrals yet</p>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Input
                id="search"
                type="text"
                label="Search Referrals"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Search by email, username, or referral code..."
              />
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'verified' | 'cancelled')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'status' | 'updated_at')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="created_at">Created Date</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Referrals ({filteredReferrals.length})
            </h3>
          </div>
          
          {filteredReferrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {referral.referrer.username?.charAt(0).toUpperCase() || referral.referrer.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referrer.username || 'No username'}
                            </div>
                            <div className="text-sm text-gray-500">{referral.referrer.email}</div>
                            <div className="text-xs text-gray-400 font-mono">{referral.referrer.referral_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{referral.referred_email}</div>
                        {referral.referred_user && (
                          <div className="text-sm text-gray-500">
                            {referral.referred_user.username || 'No username'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(referral.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No referrals have been made yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 