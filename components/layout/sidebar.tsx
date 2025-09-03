'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Home,
  FileText,
  Library,
  ArrowLeft,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const navigation = [
    { name: 'Dasbor', href: '/dashboard', icon: Home },
    { name: 'Data HKI', href: '/hki', icon: FileText },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      ref={sidebar}
      className={cn(
        `flex h-screen flex-col bg-white shadow-lg duration-300 ease-in-out
        lg:static lg:translate-x-0`,
        sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
        collapsed && 'lg:w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Library className="h-7 w-7 text-blue-600" />
          {!collapsed && <span className="text-xl">HKI Panel</span>}
        </Link>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto">
        <nav className="mt-5 px-2 lg:px-4">
          <h3
            className={cn(
              'mb-4 ml-2 text-sm font-semibold text-muted-foreground',
              collapsed && 'hidden'
            )}
          >
            MENU
          </h3>
          <ul className="mb-6 flex flex-col gap-1.5">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100",
                      isActive && "bg-gray-100 text-primary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!collapsed && <span>{item.name}</span>}
                    {isActive && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-md"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Keluar</span>}
        </Button>
        {!collapsed && <p className="mt-2 text-xs text-muted-foreground">Versi 1.0.0</p>}
      </div>
    </aside>
  );
};
