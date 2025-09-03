'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, CircleUser, LogOut, Bell, Settings, Sun, Moon } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const navigation = [
  { name: 'Dasbor', href: '/dashboard' },
  { name: 'Data HKI', href: '/hki' },
];

export const Topbar = ({ sidebarOpen, setSidebarOpen }: TopbarProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil keluar!');
    router.refresh();
  };

  // Buat breadcrumbs sederhana dari pathname
  const breadcrumbs = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white/90 backdrop-blur-md border-b">
      <div className="flex flex-grow items-center justify-between px-4 py-3 md:px-6 2xl:px-11">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dasbor
            </Link>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="mx-2">/</span>
                <span className="capitalize">{crumb}</span>
              </span>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifikasi */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Tidak ada notifikasi</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
                {loadingUser ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                ) : (
                  <CircleUser className="h-8 w-8" />
                )}
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-medium text-black">
                    {user?.email || 'Guest'}
                  </span>
                  <span className="block text-xs text-muted-foreground">Administrator</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Fitur belum tersedia')}>
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
