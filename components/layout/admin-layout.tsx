'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './navbar'; // Ganti nama file jika perlu
import { Footer } from './footer';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-950">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-full flex-col">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 2xl:p-10">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}