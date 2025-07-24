'use client';

import AdminCheck from '@/components/AdminCheck';
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
    <>
      {isLoginPage ? (
        // For login page, render without AdminCheck and navbar
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        // For other admin pages, use AdminCheck and render with navbar
        <AdminCheck>
          <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            <main className="lg:pl-64">
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </AdminCheck>
      )}
    </>
  );
} 