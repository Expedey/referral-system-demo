'use client';

import { useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Alert {
  type: 'success' | 'error';
  message: string;
}

export default function AdminInvitesPage() {
  const { admin } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    password: string;
  } | null>(null);



  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);



  // Handle invite submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await AdminService.createInvitation(
        email,
        'super_admin',
        admin?.id as string
      );

      if (result.success && result.invitation) {
        setAlert({
          type: 'success',
          message: 'Admin invited successfully'
        });
        setInviteResult({
          email: email,
          password: result.password as string
        });
        setEmail('');
      } else {
        setAlert({
          type: 'error',
          message: result.error || 'Failed to invite admin'
        });
      }
    } catch (error) {
      console.error('Error inviting admin:', error);
      setAlert({
        type: 'error',
        message: 'Failed to invite admin'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Invitations</h1>

      {/* Alert Section */}
      {alert && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            {alert.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p>{alert.message}</p>
          </div>
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite New Admin</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={loading}
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div> */}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending Invite...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Invite Result */}
      {inviteResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Invitation Sent Successfully
          </h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {inviteResult.email}
            </p>
            <p>
              <span className="font-medium">Generated Password:</span>{' '}
              {inviteResult.password}
            </p>
            <p className="text-sm text-gray-600">
              Please securely share these credentials with the invited admin.
            </p>
          </div>
        </div>
      )}


    </div>
  );
} 