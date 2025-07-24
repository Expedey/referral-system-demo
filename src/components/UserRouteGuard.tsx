'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface UserRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function UserRouteGuard({ 
  children, 
  fallback 
}: UserRouteGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pages that should redirect admins to admin dashboard
  const userOnlyPages = [
    '/',
    '/dashboard',
    '/leaderboard',
    '/signup',
    '/signin'
  ];

  const isUserOnlyPage = userOnlyPages.includes(pathname);

  useEffect(() => {
    if (!loading && user && isAdmin && isUserOnlyPage) {
      // Admin user trying to access regular user page - redirect to admin dashboard
      router.push('/admin/dashboard');
    }
  }, [user, loading, isAdmin, isUserOnlyPage, router]);

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If admin user on user-only page, don't render children (will redirect)
  if (user && isAdmin && isUserOnlyPage) {
    return null;
  }

  // Render children for all other cases
  return <>{children}</>;
} 