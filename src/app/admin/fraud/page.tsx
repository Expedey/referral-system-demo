'use client';

export default function AdminFraudPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fraud Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage flagged accounts and suspicious activity
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Fraud Monitoring</h3>
            <p className="mt-1 text-sm text-gray-500">
              This feature will be implemented in Phase 4. It will include IP pattern analysis, 
              email pattern detection, device duplication tracking, and automated flagging system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 