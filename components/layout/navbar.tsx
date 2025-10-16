// components/layout/navbar.tsx
'use client'

// PERBAIKAN: Menambahkan 'memo' ke dalam import dari React
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Menu, LogOut, Bell, Settings, ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface TopbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
}

/**
 * Komponen Breadcrumbs untuk navigasi.
 * Dibuat sebagai komponen terpisah dan di-memoize untuk optimasi.
 */
const TopbarBreadcrumbs = memo(function TopbarBreadcrumbs() {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts[0] !== 'dashboard') return []

    return pathParts.slice(1).map((part, index) => {
      const href = `/dashboard/${pathParts.slice(1, index + 2).join('/')}`
      const label = part.replace(/-/g, ' ')
      return { href, label }
    })
  }, [pathname])

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage className="capitalize">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="capitalize">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
})
TopbarBreadcrumbs.displayName = 'TopbarBreadcrumbs'

export function Topbar({ sidebarOpen, setSidebarOpen }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const router = useRouter()
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
    const toastId = toast.loading('Sedang keluar...')
    try {
      await supabase.auth.signOut()
      toast.success('Berhasil keluar!', { id: toastId })
      router.push('/login')
    } catch (err) {
      console.error('❌ Error saat logout:', err)
      toast.error('Gagal keluar. Silakan coba lagi.', { id: toastId })
    }
  }, [router, supabase])

  const getInitials = (email?: string | null) =>
    email ? email.charAt(0).toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 shadow-sm backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground transition-transform hover:scale-105"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <TopbarBreadcrumbs />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="User Menu"
              >
                <Avatar className="h-8 w-8">
                  {loadingUser ? (
                    <Skeleton className="h-full w-full rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-semibold text-foreground">
                    {loadingUser
                      ? 'Memuat...'
                      : user?.email?.split('@')[0] || 'Admin'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-semibold">Akun Saya</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {loadingUser
                    ? 'Memuat email...'
                    : user?.email || 'Tidak login'}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/pengaturan">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
