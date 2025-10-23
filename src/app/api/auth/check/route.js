import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { client as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Si Supabase está disponible, intentar validar la sesión con supabase.auth.getUser
  try {
    if (supabase && supabase.auth && typeof supabase.auth.getUser === 'function') {
      // Intentar obtener la cookie de acceso (si se usó supabase client en el cliente)
      const cookieStore = await cookies();
      const sbSession = cookieStore.get('sb:session');
      if (sbSession) {
        try {
          const parsed = JSON.parse(sbSession.value);
          // supabase client puede validar token si se lo pasa
          const token = parsed?.access_token;
          if (token) {
            const { data: user, error } = await supabase.auth.getUser(token);
            if (!error && user?.user) {
              return NextResponse.json({ ok: true, authenticated: true, role: user.user?.user_metadata?.role || 'user', user: { id: user.user.id, name: user.user.user_metadata?.name || user.user.email, email: user.user.email } });
            }
          }
        } catch (e) {
          // ignore and fallback
        }
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  // Fallback: leer cookie session local
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return NextResponse.json({ ok: false, authenticated: false });
  try {
    const sessionData = JSON.parse(session.value);
    return NextResponse.json({ ok: true, authenticated: true, role: sessionData.role, user: { id: sessionData.id, name: sessionData.name, email: sessionData.email, role: sessionData.role } });
  } catch {
    return NextResponse.json({ ok: false, authenticated: false });
  }
}
