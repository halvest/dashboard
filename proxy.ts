import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Hanya melakukan pengecekan sesi di proxy.
  // Tidak perlu otorisasi berat seperti mengecek role admin di sini
  // untuk mencegah ketergantungan API Node.js dan mempertahankan kinerja Edge.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match semua path request kecuali untuk file-file statis:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file favicon)
     * - api (hindari middleware intercept API internal jika ada)
     * - file gambar lainnya
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}