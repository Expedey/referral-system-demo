'use client';

import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNavbar from '@/components/AdminNavbar';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AdminRouteGuard>
      {isLoginPage ? (
        // For login page, render without navbar and sidebar
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        // For other admin pages, render with navbar and sidebar
        <div className="min-h-screen bg-gray-50">
          <AdminNavbar />
          <main className="lg:pl-64">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      )}
    </AdminRouteGuard>
  );
} 