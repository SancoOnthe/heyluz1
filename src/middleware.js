import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Leer cookie de sesión
  const sessionCookie = req.cookies.get('session');
  let session = null;
  try {
    session = sessionCookie?.value ? JSON.parse(sessionCookie.value) : null;
  } catch {
    session = null;
  }

  const isAuthenticated = Boolean(session?.id);
  const role = session?.role || 'user';

  // Proteger /admin
  // Proteger rutas de admin (excluyendo la pantalla de login de admin)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin-login';
      return NextResponse.redirect(url);
    }
    if (!['admin', 'editor'].includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = '/user';
      return NextResponse.redirect(url);
    }
  }

  // Proteger /user
  if (pathname.startsWith('/user')) {
    if (!isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', '/user');
      return NextResponse.redirect(url);
    }
  }

  // Si ya está autenticado y entra a /admin-login -> redirigir a destino según rol
  if (pathname === '/admin-login' && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = ['admin', 'editor'].includes(role) ? '/admin' : '/user';
    return NextResponse.redirect(url);
  }

  // Si ya está autenticado y entra a /login o /register -> redirigir
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = ['admin', 'editor'].includes(role) ? '/admin' : '/user';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/login',
    '/register'
  ],
};
