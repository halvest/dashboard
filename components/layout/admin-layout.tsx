"use client";

import React, { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./navbar";
import { Footer } from "./footer";

// 🔹 Error Boundary sederhana untuk menghindari crash total UI
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("❌ Error in AdminLayout:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-slate-950">
          <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-red-600">
              Terjadi Kesalahan
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Mohon refresh halaman atau hubungi admin jika masalah berlanjut.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminLayoutComponent({ children }: React.PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔹 Callback biar lebih efisien (hindari re-render berlebih)
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={toggleSidebar} />

        {/* Content */}
        <main role="main" className="flex-1 focus:outline-none" tabIndex={-1}>
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

// 🔹 Dibungkus ErrorBoundary agar lebih aman
export const AdminLayout = React.memo(function AdminLayout(
  props: React.PropsWithChildren
) {
  return (
    <ErrorBoundary>
      <AdminLayoutComponent {...props} />
    </ErrorBoundary>
  );
});
