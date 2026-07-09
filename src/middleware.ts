import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/types'

// Route map per role
const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/dashboard',
  lecturer: '/lecturer/dashboard',
  admin: '/admin/dashboard',
  company: '/company/dashboard',
}

const PROTECTED_PREFIXES: Record<string, UserRole> = {
  '/student': 'student',
  '/lecturer': 'lecturer',
  '/admin': 'admin',
  '/company': 'company',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lewati static files dan API routes yang tidak perlu auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Update session (refresh cookies)
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const isAuthPage = pathname === '/login' || pathname === '/reset-password' || pathname === '/update-password'

  // Jika belum login dan akses halaman protected → redirect login
  if (!user) {
    if (isAuthPage) return supabaseResponse
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login dan akses halaman auth → redirect ke dashboard
  if (isAuthPage) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as UserRole | undefined
    const home = role ? ROLE_HOME[role] : '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // Cek otorisasi berdasarkan prefix route
  const matchedPrefix = Object.keys(PROTECTED_PREFIXES).find((prefix) =>
    pathname.startsWith(prefix)
  )

  if (matchedPrefix) {
    const requiredRole = PROTECTED_PREFIXES[matchedPrefix]

    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role as UserRole | undefined
    const isActive = profile?.is_active ?? false

    // Akun tidak aktif → redirect login
    if (!isActive) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'account_inactive')
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    // Role salah → redirect ke dashboard role yang benar
    if (userRole !== requiredRole) {
      const correctHome = userRole ? ROLE_HOME[userRole] : '/login'
      return NextResponse.redirect(new URL(correctHome, request.url))
    }
  }

  // Root redirect ke dashboard sesuai role
  if (pathname === '/') {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as UserRole | undefined
    const home = role ? ROLE_HOME[role] : '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
