'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import Button from '@/components/Button';

export default function AdminDashboardPage() {
  const { admin, adminSignOut } = useAdminAuth();

  const handleSignOut = async () => {
    await adminSignOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, {admin?.email}
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                  {admin?.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Admin Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Dashboard content will be implemented in the next phase.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 