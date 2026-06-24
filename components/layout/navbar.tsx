// components/layout/navbar.tsx
'use client'

import React, { useMemo, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Menu, Settings } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'

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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { LogoutSubmitButton } from '@/components/auth/logout-button'

interface TopbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  user?: User | null
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

/**
 * Topbar menerima `user` sebagai prop dari Server Component (layout.tsx).
 * Tidak menggunakan useEffect / onAuthStateChange / getUser() di sini.
 * Ini menghilangkan penyebab utama "Failed to fetch" saat sesi sudah expired.
 */
export function Topbar({ sidebarOpen, setSidebarOpen, user }: TopbarProps) {
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
                  <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-semibold text-foreground">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-semibold">Akun Saya</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email || 'Tidak login'}
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
              {/*
               * Gunakan <form action={signOutAction}> sebagai pengganti onClick handler.
               * Ini adalah pola paling stabil untuk logout di Next.js App Router:
               * - Tidak memerlukan client-side fetch (tidak ada "Failed to fetch")
               * - redirect() di server action langsung dieksekusi oleh server
               * - Loading state dikelola oleh useFormStatus, bukan state manual
               */}
              <form action={signOutAction} className="w-full">
                <DropdownMenuItem asChild>
                  <LogoutSubmitButton className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive disabled:pointer-events-none disabled:opacity-50">
                    Keluar
                  </LogoutSubmitButton>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
