'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
// 1. Impor ikon DI DALAM Client Component
import {
  Database,
  HardDrive,
  UploadCloud,
  Server,
  Terminal,
  Users, // <-- TAMBAHKAN INI
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'

// 2. Definisikan tipe prop baru sebagai string
export type StatCardIcon =
  | 'database'
  | 'hardDrive'
  | 'uploadCloud'
  | 'server'
  | 'terminal'
  | 'users' // <-- TAMBAHKAN INI

interface StatProgressCardProps {
  icon: StatCardIcon // 3. Ubah tipe prop
  title: string
  usage: number // Selalu harapkan angka (bytes atau count)
  limit: number // Selalu harapkan angka (bytes atau count)
  unit: 'bytes' | 'count' // Tipe unit
}

// 4. Buat pemetaan dari string ke Komponen Ikon
const iconMap: Record<StatCardIcon, LucideIcon> = {
  database: Database,
  hardDrive: HardDrive,
  uploadCloud: UploadCloud,
  server: Server,
  terminal: Terminal,
  users: Users, // <-- TAMBAHKAN INI
}

// Helper untuk format angka
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  // Perbaikan: Handle log(0) atau angka negatif
  const i = bytes <= 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const formatCount = (count: number) => {
  return count.toLocaleString('id-ID')
}

export function StatProgressCard({
  icon,
  title,
  usage,
  limit,
  unit,
}: StatProgressCardProps) {
  const Icon = iconMap[icon] || AlertTriangle

  const percentage =
    limit > 0 ? Math.max(0, Math.min(100, (usage / limit) * 100)) : 0

  const usageText = unit === 'bytes' ? formatBytes(usage) : formatCount(usage)
  const limitText = unit === 'bytes' ? formatBytes(limit) : formatCount(limit)

  const progressColor =
    percentage > 90
      ? 'bg-destructive'
      : percentage > 75
        ? 'bg-yellow-500'
        : 'bg-primary'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{usageText}</div>
        <p className="text-xs text-muted-foreground">
          dari {limitText} (batas free plan)
        </p>
        <Progress
          value={percentage}
          className={cn('mt-4 h-3', '[&>div]:transition-all [&>div]:duration-500', `[&>div]:${progressColor}`)}
        />
        <p className="text-sm font-medium text-right mt-2">
          {percentage.toFixed(1)}%
        </p>
      </CardContent>
    </Card>
  )
}
