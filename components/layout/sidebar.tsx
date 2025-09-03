'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, Library, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Tipe Data & Konstanta ---
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const mainNavigation: NavItem[] = [
  { name: 'Dasbor', href: '/dashboard', icon: Home },
  { name: 'Data HKI', href: '/hki', icon: FileText },
];

// --- Komponen Anak (Tidak perlu diubah) ---
const SidebarLink = ({ item }: { item: NavItem }) => {
  const pathname = usePathname();
  const isActive =
    item.href === '/dashboard'
      ? pathname === item.href
      : pathname.startsWith(item.href);

  return (
    <li className="relative">
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-md px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-600',
          isActive && 'bg-blue-50 text-blue-600'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{item.name}</span>
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-blue-600" />
        )}
      </Link>
    </li>
  );
};

// --- Komponen Utama dengan Framer Motion ---
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Hook untuk menutup sidebar saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  // Varian animasi untuk sidebar
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  // Varian animasi untuk overlay
  const overlayVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as 'auto' },
    closed: { opacity: 0, pointerEvents: 'none' as 'none' },
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Overlay Gelap */}
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          />

          {/* Kontainer Sidebar (Drawer) */}
          <motion.aside
            key="sidebar"
            ref={sidebarRef}
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r bg-white"
          >
            {/* Header Sidebar */}
            <div className="flex items-center justify-between border-b px-4 py-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold"
              >
                <Library className="h-7 w-7 shrink-0 text-blue-600" />
                <span className="text-xl">HKI Panel</span>
              </Link>
            </div>

            {/* Menu Navigasi Utama */}
            <nav className="flex-1 overflow-y-auto p-2 pt-4">
              <ul className="flex flex-col gap-1.5">
                {mainNavigation.map((item) => (
                  <SidebarLink key={item.name} item={item} />
                ))}
              </ul>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};