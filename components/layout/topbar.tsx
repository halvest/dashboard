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

interface TopbarProps {
  setSidebarOpen: (val: boolean) => void;
}

export const Topbar = ({ setSidebarOpen }: TopbarProps) => {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [supabase]);

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
    .filter(Boolean)
    .map((crumb) => crumb.replace(/-/g, ' '));

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white/90 shadow-sm backdrop-blur-md transition-shadow dark:bg-gray-900/90">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 2xl:px-11">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Tombol Menu (selalu terlihat) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dasbor
            </Link>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {crumb}
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
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifikasi">
                <Bell className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-default text-gray-500">
                Tidak ada notifikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-3 p-2"
                aria-label="User Menu"
              >
                {loadingUser ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                ) : (
                  <CircleUser className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                )}
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-medium text-black dark:text-white">
                    {user?.email || 'Guest'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Administrator
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500"
              >
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