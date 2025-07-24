'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminRouteGuard({ 
  children, 
  fallback 
}: AdminRouteGuardProps) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't apply route guard to login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [admin, loading, router, isLoginPage]);

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // If not admin and not on login page, don't render children (will redirect)
  if (!admin && !isLoginPage) {
    return null;
  }

  // If admin or on login page, render children
  return <>{children}</>;
} 