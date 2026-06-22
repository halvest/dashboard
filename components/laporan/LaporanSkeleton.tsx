import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function LaporanFilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
      <Skeleton className="h-10 w-full sm:w-[200px] rounded-md" />
    </div>
  )
}

export function LaporanContentSkeleton() {
  return (
    <div className="space-y-8 mt-8 animate-pulse">
      {/* Insight Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm border dark:border-gray-800">
            <CardContent className="p-5 flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="dark:border-gray-800" />

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 shadow-sm dark:border-gray-800">
          <CardHeader>
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-md" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 shadow-sm dark:border-gray-800">
          <CardHeader>
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-[200px] rounded-full mx-auto" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
