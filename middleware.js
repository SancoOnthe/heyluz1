import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session');
  // No imprimir logs de diagnóstico aquí; leer cookie si existe
  // (comportamiento mínimo para autorización)
  const role = (() => {
    try { return session ? JSON.parse(session.value).role : null; } catch { return null; }
  })();

  // Rutas protegidas
  const isAdminPath = pathname.startsWith('/admin');
  const isUserPath = pathname.startsWith('/user');

  if (isAdminPath && !['admin','editor'].includes(role)) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  if (isUserPath && !role) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
