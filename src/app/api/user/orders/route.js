import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Preferir Supabase si el proyecto está configurado; mantener fallback a archivo
let supabase = null;
try {
  // import dinámico para evitar errores en entornos sin deps
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { dbClient } = require('@/lib/dbClient');
  supabase = dbClient;
} catch (e) {
  supabase = null;
}

export const dynamic = 'force-dynamic';

function readOrdersFile() {
  const file = path.join(process.cwd(), 'src', 'data', 'orders.json');
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    return [];
  }
}

async function getSessionFromCookie(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return null;
  try {
    const val = decodeURIComponent(match[1]);
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const perPage = Number(url.searchParams.get('perPage') || '10');

    const session = await getSessionFromCookie(request);
    if (!session) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    if (supabase) {
      // obtener orders desde Supabase
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', session.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);
      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data: data || [], page, perPage, total: count || (data || []).length });
    }

    const orders = readOrdersFile();
    const userOrders = orders.filter(o => String(o.user?.id) === String(session.id));
    const total = userOrders.length;
    const start = (page - 1) * perPage;
    const paged = userOrders.slice(start, start + perPage);

    return NextResponse.json({ ok: true, data: paged, page, perPage, total });
  } catch (error) {
    console.error('Orders API error', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { id, action } = body || {};
    if (!id || !action) return NextResponse.json({ ok: false, error: 'Missing id or action' }, { status: 400 });

    // Helper to map action -> status
    function mapActionToStatus(a) {
      if (a === 'mark_received') return 'pagado';
      if (a === 'request_return') return 'cancelado';
      if (a === 'mark_shipped') return 'enviado';
      return null;
    }

    const newStatus = mapActionToStatus(action);
    if (!newStatus) return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });

    if (supabase) {
      // update order in Supabase ensuring ownership
      const { data: existing, error: fetchErr } = await supabase.from('orders').select('*').eq('id', id).limit(1).single();
      if (fetchErr || !existing) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
      if (String(existing.user_id) !== String(session.id)) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });

      const { data, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id).select().single();
      if (error) {
        console.error('Error updating order in Supabase:', error);
        return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data });
    }

    // Fallback file-based behavior (for tests / local)
    const file = path.join(process.cwd(), 'src', 'data', 'orders.json');
    let orders = [];
    try {
      const txt = fs.readFileSync(file, 'utf8');
      orders = JSON.parse(txt || '[]');
    } catch (e) {
      orders = [];
    }

    const idx = orders.findIndex(o => String(o.id) === String(id) && String(o.user?.id) === String(session.id));
    if (idx === -1) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });

    orders[idx].status = newStatus;

    try {
      fs.writeFileSync(file, JSON.stringify(orders, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing orders file', e);
      return NextResponse.json({ ok: false, error: 'Could not persist order' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: orders[idx] });
  } catch (error) {
    console.error('Orders PATCH error', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
