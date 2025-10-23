import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const res = NextResponse.json({ ok: true, message: 'Cookies seteadas' });
  res.cookies.set('session_dbg', '1', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
    secure: false,
  });
  res.cookies.set('session', JSON.stringify({ id: 'test', role: 'admin' }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
    secure: false,
  });
  return res;
}
