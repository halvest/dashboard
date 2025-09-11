// components/layout/navbar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  CircleUser,
  LogOut,
  Bell,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { User } from "@supabase/supabase-js";

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export function Topbar({ sidebarOpen, setSidebarOpen }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const { theme, setTheme } = useTheme();

  // ✅ Fetch user session safely
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error && error.name !== "AuthSessionMissingError") {
          throw error;
        }

        if (isMounted) {
          setUser(data?.user ?? null);
        }
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // ✅ Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil keluar!");
      router.refresh();
    } catch (err) {
      console.error("❌ Error saat logout:", err);
      toast.error("Gagal keluar. Coba lagi.");
    }
  }, [router, supabase]);

  // ✅ Theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // ✅ Breadcrumbs
  const breadcrumbs = useMemo(
    () =>
      pathname
        .split("/")
        .filter(Boolean)
        .map((crumb) => crumb.replace(/-/g, " ")),
    [pathname]
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex"
          >
            <Link
              href="/dashboard"
              className="capitalize transition-colors hover:text-foreground"
            >
              {breadcrumbs[0] || "Dasbor"}
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
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifikasi"
                className="relative transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <Bell className="h-5 w-5" />
                {/* 🔔 Badge notifikasi */}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
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
                className="flex h-auto items-center gap-3 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    {!loadingUser && !user
                      ? "Guest"
                      : user?.email?.split("@")[0] || "Admin"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {!loadingUser && !user ? "Anonymous" : "Administrator"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p>Akun Saya</p>
                <p className="text-xs font-normal text-muted-foreground truncate">
                  {loadingUser ? "Loading..." : user?.email || "Tidak login"}
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
}
