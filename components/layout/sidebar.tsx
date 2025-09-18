// app/components/layout/sidebar.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  FileText,
  LogOut,
  Settings,
  BarChart3,
  Users,
  Database,
  type LucideIcon,
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
// --- Tipe Data & Konstanta ---
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

const mainNavigation: NavItem[] = [
  { name: 'Beranda', href: '/dashboard', icon: Home },
  {
    name: 'Data Pengajuan Fasilitasi',
    href: '/dashboard/data-pengajuan-fasilitasi',
    icon: FileText,
  },
]

const managementNavigation: NavItem[] = [
  { name: 'Laporan', href: '/dashboard/laporan', icon: BarChart3 },
  { name: 'Data Master', href: '/dashboard/data-master', icon: Database },
  {
    name: 'Manajemen Pengguna',
    href: '/dashboard/manajemen-pengguna',
    icon: Users,
  },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
]

// --- Komponen Anak ---
const SidebarLink = ({ item }: { item: NavItem }) => {
  const pathname = usePathname()
  const isActive =
    item.href === '/dashboard'
      ? pathname === item.href
      : pathname.startsWith(item.href)

  return (
    <li className="relative">
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-md px-4 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white',
          isActive && 'bg-slate-800 text-blue-400'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{item.name}</span>
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-blue-500" />
        )}
      </Link>
    </li>
  )
}

// --- Konten Inti Sidebar ---
const SidebarContent = () => {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data.user) {
        setUser(data.user)
      }
      setIsLoading(false)
    }
    fetchUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Berhasil keluar!') // Notifikasi dari langkah sebelumnya
    router.push('/login')
    router.refresh()
  }

  const getInitials = (email?: string) => {
    if (!email) return '?'
    return email.charAt(0).toUpperCase()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header Sidebar */}
      <div className="flex h-20 items-center justify-between border-b border-slate-700/50 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Image
            src="/logo_sleman.png"
            alt="Logo Sleman"
            width={50}
            height={50}
            className="shrink-0"
            priority
          />
          <span className="text-xl text-white">Panel Dashboard</span>
        </Link>
      </div>

      {/* Menu Navigasi (Tidak berubah) */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <ul className="flex flex-col gap-1.5">
          {mainNavigation.map((item) => (
            <SidebarLink key={item.name} item={item} />
          ))}
        </ul>
        <div>
          <h3 className="px-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Manajemen
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {managementNavigation.map((item) => (
              <SidebarLink key={item.name} item={item} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer Sidebar (Profil & Logout) (Tidak berubah) */}
      <div className="mt-auto border-t border-slate-700/50 p-4">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-slate-700" />
              <Skeleton className="h-3 w-1/2 bg-slate-700" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">Admin</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda yakin ingin keluar dari sesi ini?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// --- Komponen Utama Sidebar (Overlay/Drawer) ---
interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen, setSidebarOpen])

  const sidebarVariants = { open: { x: 0 }, closed: { x: '-100%' } }
  const overlayVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as 'auto' },
    closed: { opacity: 0, pointerEvents: 'none' as 'none' },
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
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

          <motion.aside
            key="sidebar"
            ref={sidebarRef}
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-40 h-full w-72 bg-slate-900"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
