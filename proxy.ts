import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js 16+ menggunakan konvensi file `proxy.ts` (bukan `middleware.ts`).
 * Nama fungsi yang diekspor juga harus `proxy`, bukan `middleware`.
 *
 * Fungsi ini dipanggil di setiap request untuk merefresh Supabase session cookies.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match semua path request kecuali untuk file-file statis:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file favicon)
     * - file gambar lainnya
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
