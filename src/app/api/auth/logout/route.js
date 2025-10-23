import { NextResponse } from 'next/server';

export async function POST(request) {
  // Limpiar cookie de sesión local y redirigir al login
  try {
    const redirectUrl = new URL('/login', request.url);
    const res = NextResponse.redirect(redirectUrl);
    // Borrar cookie de sesión
    res.cookies.set('session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
    return res;
  }
}
