import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { dbClient as supabase } from '@/lib/dbClient';

export async function POST(request) {
  try {
    const form = await request.formData();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    if (!email || !password) {
      const url = new URL('/admin-login?error=missing', request.url);
      return NextResponse.redirect(url);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      const url = new URL('/admin-login?error=invalid', request.url);
      return NextResponse.redirect(url);
    }

    const userId = data.user?.id;
    const { data: profiles } = await supabase.from('profiles').select('*').eq('id', userId).limit(1);
    const profile = (profiles && profiles[0]) || null;

    const session = {
      id: userId,
      role: profile?.role || 'user',
      username: data.user?.email?.split('@')[0] || '',
      email: data.user?.email || email,
      name: profile?.name || data.user?.user_metadata?.name || data.user?.email?.split('@')[0]
    };

    const redirectPath = ['admin','editor'].includes(session.role) ? '/admin' : '/user';
    const res = NextResponse.redirect(new URL(redirectPath, request.url));
    res.cookies.set('session', JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: false
    });
    return res;
  } catch (err) {
    const url = new URL('/admin-login?error=unknown', request.url);
    return NextResponse.redirect(url);
  }
}
