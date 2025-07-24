"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AdminCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminCheck({ 
  children, 
  fallback 
}: AdminCheckProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!loading && user && !hasChecked) {
      const checkAdminStatus = async () => {
        setIsCheckingAdmin(true);
        try {
          // Import AdminService dynamically to avoid circular dependencies
          const { AdminService } = await import('@/services/adminService');
          const admin = await AdminService.getCurrentAdmin();
          
          if (admin) {
            setIsAdmin(true);
          } else {
            // User is not an admin, redirect to regular dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          // If admin check fails, redirect to regular dashboard
          router.push('/dashboard');
        } finally {
          setIsCheckingAdmin(false);
          setHasChecked(true);
        }
      };
      
      checkAdminStatus();
    } else if (!loading && !user) {
      // User not authenticated, redirect to signup
      router.push('/signup');
      setHasChecked(true);
    } else if (!loading) {
      // Auth loading is done, no user, mark as checked
      setHasChecked(true);
    }
  }, [user, loading, router, hasChecked]);

  // Show loading state
  if (loading || isCheckingAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is admin and we've finished checking
  if (isAdmin && hasChecked) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting or if not admin
  return null;
} 