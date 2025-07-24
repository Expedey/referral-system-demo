import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AdminRouteGuard>
  );
} 