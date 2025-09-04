import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Toaster } from '@/components/ui/sonner'; // Pastikan Toaster di sini

/**
 * Layout ini membungkus semua halaman di dalam route group (dashboard).
 * Ini memastikan bahwa hanya admin yang bisa mengakses halaman-halaman ini
 * dan menerapkan layout admin secara konsisten.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteksi semua rute di dalam grup ini.
  await requireAdmin();

  return (
    <AdminLayout>
      {children}
      <Toaster position="top-center" richColors />
    </AdminLayout>
  );
}