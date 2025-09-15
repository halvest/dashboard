// lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client ini menggunakan ANON_KEY, cocok untuk operasi atas nama pengguna.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Biarkan kosong jika terjadi di Server Component.
          }
        },
      },
    }
  )
}

// ✅ Client ini menggunakan SERVICE_ROLE_KEY, wajib untuk operasi admin.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Menggunakan kunci rahasia
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op untuk service role
        },
      },
    }
  )
}