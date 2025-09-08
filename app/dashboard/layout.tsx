// app/dashboard/layout.tsx
import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Toaster } from '@/components/ui/sonner'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  return (
    <AdminLayout>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </AdminLayout>
  )
}
