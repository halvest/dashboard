// components/layout/navbar.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, LogOut, Bell, Settings, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

interface TopbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
}

export function Topbar({ sidebarOpen, setSidebarOpen }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoadingUser(false)
    }

    fetchInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Berhasil keluar!')
      router.push('/login')
    } catch (err) {
      console.error('❌ Error saat logout:', err)
      toast.error('Gagal keluar. Coba lagi.')
    }
  }, [router, supabase])

  const breadcrumbs = useMemo(
    () =>
      pathname
        .split('/')
        .filter(Boolean)
        .map((crumb) => crumb.replace(/-/g, ' ')),
    [pathname]
  )

  const getInitials = (email?: string | null) =>
    email ? email.charAt(0).toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-slate-50/80 shadow-sm backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 transition hover:bg-slate-200/60 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 md:flex"
          >
            <Link
              href="/dashboard"
              className="capitalize transition-colors hover:text-slate-900"
            >
              {breadcrumbs[0] || 'Dasbor'}
            </Link>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              // ✅ FIX: Menggunakan shorthand fragment <>...</>
              <React.Fragment key={idx}>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="capitalize text-slate-800 font-semibold">
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikasi"
            className="relative text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
                aria-label="User Menu"
              >
                <Avatar className="h-8 w-8">
                  {loadingUser ? (
                    <div className="h-full w-full animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    <AvatarFallback className="bg-blue-500 text-sm font-semibold text-white">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-semibold text-slate-800">
                    {!loadingUser && user ? user.email?.split('@')[0] : 'Admin'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-semibold">Akun Saya</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {loadingUser ? 'Memuat...' : user?.email || 'Tidak login'}
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
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
  )
}
