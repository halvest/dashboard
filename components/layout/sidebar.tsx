// components/layout/sidebar.tsx
'use client'

// PERBAIKAN: Menambahkan 'memo', 'useRef', dan 'useCallback' ke dalam import dari React
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  useCallback,
} from 'react'
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
  Gauge, // <-- 1. ICON BARU DITAMBAHKAN
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
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// --- Tipe & Data Navigasi ---
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
  { name: 'Pengaturan', href: '/dashboard/pengaturan', icon: Settings },
]

// --- Komponen Anak yang Dioptimalkan ---

const SidebarLink = memo(({ item }: { item: NavItem }) => {
  const pathname = usePathname()
  const isActive =
    item.href === '/dashboard'
      ? pathname === item.href
      : pathname.startsWith(item.href)

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 rounded-md px-4 py-2.5 font-medium transition-all duration-200',
          'text-slate-400 hover:bg-slate-800/80 hover:text-white', // Tema yang Anda sukai dipertahankan
          isActive &&
            'rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.name}</span>
        {isActive && (
          <span className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-blue-300" />
        )}
      </Link>
    </li>
  )
})
SidebarLink.displayName = 'SidebarLink'

const UserProfileSection = memo(function UserProfileSection() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return // Dihandle oleh fetchUser
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (session) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = useCallback(async () => {
    const toastId = toast.loading('Sedang keluar...')
    try {
      await supabase.auth.signOut()
      toast.success('Berhasil keluar!', { id: toastId })
      router.push('/login')
    } catch (err) {
      console.error('❌ Error saat logout:', err)
      toast.error('Gagal keluar, coba lagi.', { id: toastId })
    }
  }, [router, supabase])

  const getInitials = (email?: string) =>
    email ? email.charAt(0).toUpperCase() : '?'

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-slate-700" />
          <Skeleton className="h-3 w-1/2 bg-slate-700" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <Avatar className="relative h-10 w-10">
        <AvatarFallback className="bg-blue-600 text-white font-semibold">
          {getInitials(user.email)}
        </AvatarFallback>
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500" />
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-semibold text-white">
          {user.user_metadata?.full_name || 'Admin'}
        </p>
        <p className="truncate text-xs text-slate-400">{user.email}</p>
      </div>
      <AlertDialog>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:bg-red-900/50 hover:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Keluar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
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
  )
})
UserProfileSection.displayName = 'UserProfileSection'

const SidebarContent = memo(function SidebarContent() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="flex h-20 items-center border-b border-slate-700/50 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-semibold transition-transform hover:scale-105"
        >
          <Image
            src="/logo_sleman.png"
            alt="Logo Sleman"
            width={44}
            height={44}
            className="shrink-0"
            priority
          />
          <span className="text-xl font-bold">Panel Dashboard</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <ul className="flex flex-col gap-2">
          {mainNavigation.map((item) => (
            <SidebarLink key={item.name} item={item} />
          ))}
        </ul>
        <div className="pt-4">
          <h3 className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            Manajemen
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {managementNavigation.map((item) => (
              <SidebarLink key={item.name} item={item} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-700/50 p-4">
        <UserProfileSection />
      </div>
    </div>
  )
})
SidebarContent.displayName = 'SidebarContent'

// --- Komponen Wrapper Utama ---
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
  }, [setSidebarOpen])

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  }

  const overlayVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as const },
    closed: { opacity: 0, pointerEvents: 'none' as const },
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
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            key="sidebar"
            ref={sidebarRef}
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            // IMPROVE: Menggunakan transisi 'spring' untuk efek yang lebih natural
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
