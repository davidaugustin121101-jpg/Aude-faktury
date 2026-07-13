import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/faktury',
  '/settings',
  '/klienti',
  '/napoveda',
  '/onboarding',
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()
  const { pathname } = request.nextUrl
  const isProtected = isProtectedRoute(pathname)

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applySecurityHeaders(NextResponse.redirect(url))
    }
    return applySecurityHeaders(NextResponse.next({ request }))
  }

  let supabaseResponse = applySecurityHeaders(NextResponse.next({ request }))

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = applySecurityHeaders(NextResponse.next({ request }))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

    if (!user && isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applySecurityHeaders(NextResponse.redirect(url))
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return applySecurityHeaders(NextResponse.redirect(url))
    }
  } catch (err) {
    console.error('[middleware] auth error:', err)
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applySecurityHeaders(NextResponse.redirect(url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|xml|txt|js|css|ico|json|mp4|webm|mov)$).*)',
  ],
}
