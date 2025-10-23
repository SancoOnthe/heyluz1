import { NextResponse } from 'next/server';
import { dbClient as supabase } from '@/lib/dbClient';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Uso estricto de Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
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

    const redirectUrl = ['admin', 'editor'].includes(session.role) ? '/admin' : '/user';
    const res = NextResponse.json({ ok: true, role: session.role, username: session.username, name: session.name, redirect: redirectUrl });
    res.cookies.set('session', JSON.stringify(session), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
