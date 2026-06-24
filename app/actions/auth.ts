'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Server Action untuk sign out.
 *
 * PENTING:
 * - `redirect()` dari Next.js bekerja dengan melempar error internal (NEXT_REDIRECT).
 * - Oleh karena itu, `redirect()` TIDAK boleh dipanggil di dalam blok try...catch.
 * - Pola yang benar: lakukan operasi di dalam try...catch, simpan hasilnya,
 *   lalu panggil redirect() setelah blok try...catch selesai.
 */
export async function signOutAction() {
  const supabase = await createClient()

  let hasError = false

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[signOutAction] Supabase signOut error:', error.message)
      hasError = true
    }
  } catch (err) {
    console.error('[signOutAction] Unexpected error during signOut:', err)
    hasError = true
  }

  // redirect() dipanggil di LUAR try...catch agar mekanisme throw internal Next.js berjalan benar.
  if (hasError) {
    redirect('/login?logout=error')
  }

  redirect('/login?logout=success')
}
