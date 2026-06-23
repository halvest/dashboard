// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const toastId = toast.loading('Mencoba masuk...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Kredensial tidak valid. Silakan periksa kembali email atau kata sandi Anda.', {
          id: toastId,
        })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        toast.error('Akses Ditolak: Anda tidak memiliki hak akses administrator.', { id: toastId })
        return
      }

      toast.success('Otentikasi berhasil! Mengarahkan ke dasbor utama...', {
        id: toastId,
      })
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('Terjadi gangguan pada server. Silakan coba lagi nanti.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Sisi Kiri: Branding & Visual (Desktop Only) */}
      <div className="relative hidden lg:flex flex-col flex-1 bg-blue-950 text-white overflow-hidden">
        {/* Background Image & Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: "url('/bappeda.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 to-transparent" />

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/logo_sleman.png"
              alt="Logo Kabupaten Sleman"
              width={72}
              height={72}
              className="h-24 w-auto drop-shadow-xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              <span className="text-sm font-medium text-blue-50 tracking-wide">Dashboard Internal</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
              Manajemen Data <br /> Pengajuan Fasilitasi HKI
            </h1>
            <p className="text-lg text-blue-200/90 leading-relaxed">
              Sistem berbasis web yang digunakan untuk menyimpan dan mengelola data pengajuan fasilitasi Hak Kekayaan Intelektual (HKI), meliputi pencatatan data pengajuan, pemantauan status, serta pengarsipan dokumen sertifikat secara terpusat.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-4 text-sm text-blue-300/80"
          >
            <span>&copy; {new Date().getFullYear()} Bappeda Kabupaten Sleman</span>
            <span>&bull;</span>
            <span>Secure Access Gateway</span>
          </motion.div>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header Mobile Only */}
          <div className="flex flex-col items-center lg:hidden space-y-4 mb-8">
            <Image
              src="/logo_sleman.png"
              alt="Logo Kabupaten Sleman"
              width={64}
              height={64}
              className="h-20 w-auto drop-shadow-md"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Portal HKI Sleman</h1>
              <p className="text-sm text-muted-foreground mt-1">Sistem Manajemen Fasilitasi</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Otentikasi identitas Anda untuk mengakses dasbor administratif.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Alamat Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@slemankab.go.id"
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-6 text-base font-semibold shadow-md hover:shadow-lg transition-all group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mengotentikasi...
                </>
              ) : (
                <>
                  Masuk ke Dasbor
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-8">
            Dikelola oleh Bidang Perencanaan, Penelitian, Pengembangan, dan Inovasi <br className="hidden sm:block" />
            Badan Perencanaan Pembangunan Daerah Kabupaten Sleman
          </p>
        </motion.div>
      </div>
    </div>
  )
}
