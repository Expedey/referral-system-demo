"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface UserRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function UserRouteGuard({ 
  children, 
  fallback 
}: UserRouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pages that require authentication (not public pages)
  const protectedPages = [
    '/',
    '/dashboard',
    '/leaderboard'
  ];

  // Public pages that don't require authentication
  const publicPages = [
    '/signup',
    '/signin'
  ];

  const isProtectedPage = protectedPages.includes(pathname);
  const isPublicPage = publicPages.includes(pathname);

  // Only handle auth redirects for protected pages
  useEffect(() => {
    if (!loading && !user && isProtectedPage) {
      // User not authenticated, redirect to signup
      router.push('/signup');
    }
  }, [user, loading, isProtectedPage, router]);

  // Show loading state only for protected pages when auth is loading
  if (loading && isProtectedPage) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children for all cases
  return <>{children}</>;
} 