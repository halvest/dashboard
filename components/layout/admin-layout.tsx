'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './navbar'; // pastikan nama file sesuai
import { Footer } from './footer';

export function AdminLayout({ children }: React.PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

        {/* Footer sticky di bawah */}
        <Footer />
      </div>
    </div>
  );
}
