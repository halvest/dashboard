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
import {
  Menu,
  CircleUser,
  LogOut,
  Bell,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { User } from '@supabase/supabase-js';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export function Topbar({ sidebarOpen, setSidebarOpen }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        // ✅ PERBAIKAN:
        // Hanya lempar error jika itu error NYATA (bukan hanya "tidak ada sesi")
        if (error && error.name !== 'AuthSessionMissingError') {
          throw error;
        }
        
        // Jika tidak ada error, ATAU error-nya hanya "session missing",
        // set user. Jika tidak ada sesi, data.user akan menjadi null, dan itu sudah benar.
        setUser(data.user);

      } catch (err) {
        // Blok catch ini sekarang hanya akan menangkap error tak terduga (misal: network)
        console.error('Error fetching user (real error):', err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [supabase]); // Dependensi [supabase] sudah benar

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil keluar!');
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="/dashboard" // Sebaiknya arahkan ke /dashboard atau /
              className="capitalize transition-colors hover:text-foreground"
            >
              {/* Jika breadcrumb[0] ada, gunakan itu, jika tidak, gunakan 'Dasbor' */}
              {breadcrumbs[0] ? breadcrumbs[0].replace(/-/g, ' ') : 'Dasbor'}
            </Link>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {crumb.replace(/-/g, ' ')}
                </span>
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
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="transition-transform hover:scale-110"
          >
            {/* Logika ini sudah benar */}
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-gray-500">
                Tidak ada notifikasi baru.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-3 p-1 rounded-full"
                aria-label="User Menu"
              >
                {loadingUser ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <CircleUser className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-medium text-black dark:text-white">
                    {/* Menampilkan 'Guest' jika user null DAN selesai loading */}
                    {!loadingUser && !user ? 'Guest' : (user?.email?.split('@')[0] || 'Admin')}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {!loadingUser && !user ? 'Anonymous' : 'Administrator'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p>Akun Saya</p>
                <p className="text-xs font-normal text-muted-foreground truncate">
                  {loadingUser ? 'Loading...' : (user?.email || 'Tidak login')}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                // Nonaktifkan tombol logout jika tidak ada user
                disabled={loadingUser || !user} 
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};