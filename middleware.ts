// middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Buat respons awal yang akan diteruskan
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Buat Supabase client yang bisa berinteraksi dengan cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Jika cookie perlu di-set, kita harus membuat ulang request dan response
          // agar header-nya ter-update dengan benar
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // DIPERBAIKI: Metode `request.cookies.delete` hanya menerima `name` (string) sebagai argumen.
          // Opsi seperti path dan domain tidak relevan untuk request cookie yang masuk.
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Metode `response.cookies.delete` tetap menggunakan objek untuk memberitahu browser cookie mana yang harus dihapus.
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Perintah ini hanya bertugas menyegarkan sesi cookie jika diperlukan.
  // Ini adalah satu-satunya tugas middleware ini.
  await supabase.auth.getUser()

  return response
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
