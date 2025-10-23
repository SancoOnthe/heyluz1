// Adapter que usa Supabase service client si está disponible,
// y hace fallback al adaptador local (`src/lib/localAuth.js`).
import * as localAuth from './localAuth';
import { getServiceClient } from './dbClient';

function isServiceAvailable() {
  try {
    const svc = getServiceClient();
    // el stub devuelve un objeto sin método .from real
    return svc && typeof svc.from === 'function' && process.env.SUPABASE_SERVICE_ROLE_KEY;
  } catch (e) {
    return false;
  }
}

export async function signIn({ email, password }) {
  if (!email || !password) return { ok: false, error: 'Email y password requeridos' };

  if (isServiceAvailable()) {
    const svc = getServiceClient();
    try {
      const { data: user, error } = await svc.from('users').select('*').eq('email', email).limit(1).single();
      if (error || !user) return { ok: false, error: 'Credenciales inválidas' };

      // Nota: este proyecto por defecto puede tener contraseñas en claro.
      // En producción deberías usar Supabase Auth o almacenar contraseñas hasheadas.
      const okPassword = user.password ? user.password === password : false;
      if (!okPassword) return { ok: false, error: 'Credenciales inválidas' };

      const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).limit(1).single();

      const role = profile?.role || 'user';
      const session = {
        id: user.id,
        role,
        username: (profile?.email || user.email).split('@')[0],
        email: user.email,
        name: profile?.name || user.user_metadata?.name || ''
      };

      return { ok: true, session, redirect: role === 'admin' || role === 'editor' ? '/admin' : '/user' };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  }

  // Fallback local
  const user = localAuth.findUserByEmail(email);
  if (!user || !localAuth.verifyPassword(user, password)) {
    return { ok: false, error: 'Credenciales inválidas' };
  }
  const profile = localAuth.ensureProfile({ id: user.id, email: user.email, name: user.user_metadata?.name });
  const session = {
    id: user.id,
    role: profile.role,
    username: profile.email.split('@')[0],
    email: profile.email,
    name: profile.name || profile.email.split('@')[0]
  };
  return { ok: true, session, redirect: profile.role === 'admin' || profile.role === 'editor' ? '/admin' : '/user' };
}

export async function signUp({ name, email, password }) {
  if (!name || !email || !password) return { ok: false, error: 'Todos los campos son requeridos' };

  if (isServiceAvailable()) {
    const svc = getServiceClient();
    try {
      // Insert user and profile (simple approach)
      const userPayload = { id: undefined, email, password, user_metadata: { name } };
      const { data: insertedUsers, error: userErr } = await svc.from('users').insert([userPayload]);
      if (userErr) {
        if (userErr.code === '23505') return { ok: false, error: 'Usuario ya existe' };
        return { ok: false, error: userErr.message || String(userErr) };
      }
      const user = Array.isArray(insertedUsers) ? insertedUsers[0] : insertedUsers;
      const profilePayload = { id: user.id, email, name, role: 'user' };
      await svc.from('profiles').insert([profilePayload]);

      const session = { id: user.id, role: 'user', username: email.split('@')[0], email, name };
      return { ok: true, session, redirect: '/user' };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  }

  // Fallback local
  try {
    const result = localAuth.createUser({ name, email, password });
    const id = result.user.id;
    const session = { id, role: 'user', username: email.split('@')[0], email, name };
    return { ok: true, session, redirect: '/user', message: 'Cuenta creada exitosamente' };
  } catch (err) {
    if (err.code === 'USER_EXISTS') return { ok: false, error: 'Usuario ya existe' };
    return { ok: false, error: String(err?.message || err) };
  }
}

export function getSessionFromCookieValue(cookieValue) {
  if (!cookieValue) return null;
  try {
    return JSON.parse(cookieValue);
  } catch {
    return null;
  }
}
