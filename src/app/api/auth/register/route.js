import { NextResponse } from 'next/server';
import { dbClient as supabase, getServiceClient } from '@/lib/dbClient';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Si dispones de service role, crear con admin API y upsert profile
    const service = getServiceClient();
    if (service && service.auth && service.auth.admin && typeof service.auth.admin.createUser === 'function') {
      try {
        const opts = { email, password, user_metadata: { name } };
        const { data: adminData, error: adminErr } = await service.auth.admin.createUser(opts);
        if (adminErr) {
          if (adminErr.message && adminErr.message.includes('already')) {
            return NextResponse.json({ ok: false, error: 'Usuario ya existe' }, { status: 400 });
          }
          console.error('Supabase admin create user error:', adminErr);
          return NextResponse.json({ ok: false, error: 'Error al crear usuario' }, { status: 500 });
        }

        const id = adminData?.user?.id;
        try {
          await service.from('profiles').upsert({ id, email, name, role: 'user' }, { onConflict: 'id' });
        } catch (e) {
          console.warn('Profile upsert warning:', e && e.message);
        }

        const session = { id, role: 'user', username: email.split('@')[0], email, name };
        const res = NextResponse.json({ ok: true, role: 'user', username: session.username, name, redirect: '/user', message: 'Cuenta creada exitosamente' });
        res.cookies.set('session', JSON.stringify(session), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
        return res;
      } catch (e) {
        console.error('Supabase register error:', e);
        return NextResponse.json({ ok: false, error: 'Error al crear la cuenta' }, { status: 500 });
      }
    }

    // Fallback: Intentar crear usuario via auth.signUp si no hay service role
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) {
        if (error.message && error.message.includes('already')) {
          return NextResponse.json({ ok: false, error: 'Usuario ya existe' }, { status: 400 });
        }
        console.error('Supabase signUp error:', error);
        return NextResponse.json({ ok: false, error: 'Error al crear usuario' }, { status: 500 });
      }

      // upsert profile
      try {
        await supabase.from('profiles').upsert({ id: data.user?.id, email, name, role: 'user' }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Profile upsert warning:', e && e.message);
      }

      const session = { id: data.user?.id, role: 'user', username: email.split('@')[0], email, name };
      const res = NextResponse.json({ ok: true, role: 'user', username: session.username, name, redirect: '/user', message: 'Cuenta creada exitosamente' });
      res.cookies.set('session', JSON.stringify(session), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
      return res;
    } catch (error) {
      console.error('Register error:', error);
      return NextResponse.json({ ok: false, error: 'Error al crear la cuenta' }, { status: 500 });
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear la cuenta' }, { status: 500 });
  }
}
