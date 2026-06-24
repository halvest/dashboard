import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // PENTING: Selalu panggil getUser() untuk merefresh token cookie.
  // Jangan gunakan getSession() sebagai satu-satunya validasi server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboardRoute = path.startsWith('/dashboard')
  // Halaman login dianggap auth route, APAPUN query param yang ada
  const isLoginPage = path === '/login'
  const isRootPage = path === '/'

  // Proteksi: user belum login mencoba akses dashboard → redirect ke login
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '' // Bersihkan query params agar tidak ada loop
    return NextResponse.redirect(url)
  }

  // User sudah login mencoba akses halaman root → redirect ke dashboard
  if (isRootPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // User sudah login mencoba akses halaman login TANPA query param logout
  // Jika ada query param (logout=success/error), biarkan mereka melihat notifikasi
  if (isLoginPage && user && !request.nextUrl.searchParams.get('logout')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

