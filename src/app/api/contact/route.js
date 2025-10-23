import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'messages.json');

async function ensureFile() {
  try {
    await fs.access(DATA_PATH);
  } catch (e) {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, '[]', 'utf8');
  }
}

async function readMessages() {
  await ensureFile();
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeMessages(messages) {
  await fs.writeFile(DATA_PATH, JSON.stringify(messages, null, 2), 'utf8');
}

export async function GET(request) {
  try {
    // Si se proporciona un email por query, devolvemos solo los mensajes de ese email (para usuarios)
    // Manejo de email: requerir sesión y que el email coincida con la sesión (o ser admin/editor)
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    let sessionUser = null;
    if (sessionCookie) {
      try {
        sessionUser = JSON.parse(sessionCookie.value);
      } catch {
        // ignore
      }
    }

    const messages = await readMessages();
    // Ordenar por fecha desc
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (email) {
      // Para proteger la privacidad, requerimos sesión y que el email solicitado coincida con la sesión
      if (!sessionUser) {
        return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
      }
      const isAdmin = ['admin', 'editor'].includes(sessionUser?.role);
      if (!isAdmin && String(sessionUser.email || '').toLowerCase() !== String(email || '').toLowerCase()) {
        return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
      }
      const filtered = messages.filter(m => String(m.email || '').toLowerCase() === String(email || '').toLowerCase());
      return NextResponse.json({ ok: true, data: filtered });
    }

    // Si no se pidió email, sólo admin/editor puede listar todo
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!['admin', 'editor'].includes(sessionUser?.role)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: messages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los mensajes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, email, telefono = '', asunto, mensaje } = body || {};

    const allowedSubjects = ['consulta', 'producto', 'pedido', 'devolucion'];

    if (!nombre || !email || !mensaje || !asunto || !allowedSubjects.includes(asunto)) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nombre: String(nombre).slice(0, 120),
      email: String(email).slice(0, 180),
      telefono: String(telefono || '').slice(0, 40),
      asunto,
      mensaje: String(mensaje).slice(0, 2000),
      createdAt: new Date().toISOString(),
      status: 'nuevo'
    };

    const messages = await readMessages();
    messages.push(newMessage);
    await writeMessages(messages);

    return NextResponse.json({ ok: true, data: newMessage });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'No se pudo enviar el mensaje' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    // Solo admin/editor puede actualizar estado
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    let user;
    try {
      user = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ ok: false, error: 'Sesión inválida' }, { status: 401 });
    }
    if (!['admin', 'editor'].includes(user?.role)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, reply } = body || {};

    const messages = await readMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Si se envía 'reply', añadimos la respuesta y marcamos como leído
    if (reply && typeof reply === 'object' && (reply.body || reply.text)) {
      const replyBody = String(reply.body || reply.text || '').slice(0, 4000);
      const replyObj = {
        responder: user?.username || user?.name || 'admin',
        body: replyBody,
        repliedAt: new Date().toISOString()
      };
      messages[idx].reply = replyObj;
      messages[idx].status = 'leido';
      messages[idx].updatedAt = new Date().toISOString();
      await writeMessages(messages);
      return NextResponse.json({ ok: true, data: messages[idx] });
    }

    // Si se actualiza únicamente el estado
    if (status) {
      const allowed = ['nuevo', 'leido', 'archivado'];
      if (!allowed.includes(status)) {
        return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
      }
      messages[idx].status = status;
      messages[idx].updatedAt = new Date().toISOString();
      await writeMessages(messages);
      return NextResponse.json({ ok: true, data: messages[idx] });
    }

    return NextResponse.json({ ok: false, error: 'No se proporcionaron campos para actualizar' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'No se pudo actualizar el mensaje' }, { status: 500 });
  }
}
