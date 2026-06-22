import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">
        Memuat halaman...
      </p>
    </div>
  )
}
