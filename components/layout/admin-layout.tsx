// components/layout/admin-layout.tsx
'use client'

import React, { useState, useCallback, ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './navbar'
import { Footer } from './footer'
import { Button } from '@/components/ui/button'
import { ServerCrash } from 'lucide-react'

// --- Error Boundary dengan UI yang Ditingkatkan ---
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    // Memperbarui state agar render berikutnya menampilkan UI fallback.
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Mencatat log error ke konsol untuk debugging.
    console.error('❌ Uncaught error in AdminLayout:', error, errorInfo)
  }

  // Fungsi untuk me-reset state error dan mencoba me-render ulang.
  handleTryAgain = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // UI Fallback yang didesain ulang menggunakan komponen shadcn/ui dan ikon.
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div
            className="flex w-full max-w-lg flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-lg"
            role="alert"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ServerCrash className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Terjadi Kesalahan Aplikasi
            </h1>
            <p className="mt-2 text-muted-foreground">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau
              hubungi administrator jika masalah berlanjut.
            </p>
            {/* Menampilkan detail error teknis HANYA di mode development.
                Ini sangat membantu saat debugging, namun aman di production.
            */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 w-full overflow-x-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
                <code>
                  {this.state.error.stack || this.state.error.message}
                </code>
              </pre>
            )}
            <Button
              onClick={this.handleTryAgain}
              className="mt-6 w-full sm:w-auto"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// --- Komponen Layout Utama ---
function AdminLayoutComponent({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Memoize fungsi untuk stabilitas referensi
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        aria-expanded={sidebarOpen}
      />

      {/* Main Area */}
      <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleToggleSidebar}
        />

        {/* Content */}
        <main
          role="main"
          className="flex-1 focus:outline-none"
          aria-label="Konten utama"
        >
          {/* Padding dan max-width untuk konten agar konsisten */}
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

// Komponen akhir yang diekspor, sudah dibungkus ErrorBoundary dan di-memoize.
export const AdminLayout = React.memo(function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ErrorBoundary>
      <AdminLayoutComponent>{children}</AdminLayoutComponent>
    </ErrorBoundary>
  )
})
