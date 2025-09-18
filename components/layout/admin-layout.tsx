// app/components/layout/admin-layout.tsx
'use client'

import React, { useState, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './navbar'
import { Footer } from './footer'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('❌ Error in AdminLayout:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-red-600">
              Terjadi Kesalahan
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Mohon refresh halaman atau hubungi admin jika masalah berlanjut.
            </p>
            <button
              onClick={this.handleRefresh}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AdminLayoutComponent({ children }: React.PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        aria-expanded={sidebarOpen}
      />

      {/* Main Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
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
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export const AdminLayout = React.memo(function AdminLayout(
  props: React.PropsWithChildren
) {
  return (
    <ErrorBoundary>
      <AdminLayoutComponent {...props} />
    </ErrorBoundary>
  )
})
