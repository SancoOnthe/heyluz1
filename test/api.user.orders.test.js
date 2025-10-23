import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import the handler module
import * as ordersRoute from '../src/app/api/user/orders/route.js';

const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');
const BACKUP_FILE = path.join(process.cwd(), 'src', 'data', 'orders.test.backup.json');

function makeReq({ method = 'GET', url = 'http://localhost/api/user/orders', headers = {}, body = null } = {}) {
  return {
    method,
    url,
    headers: new Map(Object.entries(headers)),
    headers: {
      get(k) { return headers[k.toLowerCase()] || null; }
    },
    json() { return Promise.resolve(body); }
  };
}

// helpers para simular NextResponse.json
function readOrdersFile() {
  const txt = fs.readFileSync(ORDERS_FILE, 'utf8');
  return JSON.parse(txt || '[]');
}

function writeOrdersFile(data) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

describe('API /api/user/orders', () => {
  let original;

  beforeEach(() => {
    // backup original
    original = fs.readFileSync(ORDERS_FILE, 'utf8');
    fs.writeFileSync(BACKUP_FILE, original, 'utf8');
  });

  afterEach(() => {
    // restore
    fs.writeFileSync(ORDERS_FILE, fs.readFileSync(BACKUP_FILE, 'utf8'), 'utf8');
    fs.unlinkSync(BACKUP_FILE);
  });

  it('GET returns 401 without session cookie', async () => {
    const req = makeReq({ method: 'GET', url: 'http://localhost/api/user/orders' });
    const res = await ordersRoute.GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('GET returns paginated orders for user session', async () => {
    const orders = readOrdersFile();
    expect(Array.isArray(orders)).toBe(true);
    // pick first order's user to build session
    const first = orders[0];
    const session = { id: first.user.id, username: first.user.username };
    const cookie = `session=${encodeURIComponent(JSON.stringify(session))};`;
    const req = makeReq({ method: 'GET', url: 'http://localhost/api/user/orders?page=1&perPage=2', headers: { cookie } });
    const res = await ordersRoute.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('PATCH updates order status for authenticated user', async () => {
    const orders = readOrdersFile();
    const first = orders[0];
    const session = { id: first.user.id, username: first.user.username };
    const cookie = `session=${encodeURIComponent(JSON.stringify(session))};`;
    const req = makeReq({ method: 'PATCH', url: 'http://localhost/api/user/orders', headers: { cookie }, body: { id: first.id, action: 'mark_received' } });
    const res = await ordersRoute.PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('pagado');

    const after = readOrdersFile();
    const found = after.find(o => o.id === first.id);
    expect(found.status).toBe('pagado');
  });

  it('PATCH mark_shipped and request_return actions work', async () => {
    const orders = readOrdersFile();
    const first = orders[0];
    const session = { id: first.user.id, username: first.user.username };
    const cookie = `session=${encodeURIComponent(JSON.stringify(session))};`;

    // mark_shipped
    let req = makeReq({ method: 'PATCH', url: 'http://localhost/api/user/orders', headers: { cookie }, body: { id: first.id, action: 'mark_shipped' } });
    let res = await ordersRoute.PATCH(req);
    expect(res.status).toBe(200);
    let body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('enviado');

    // request_return
    req = makeReq({ method: 'PATCH', url: 'http://localhost/api/user/orders', headers: { cookie }, body: { id: first.id, action: 'request_return' } });
    res = await ordersRoute.PATCH(req);
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('cancelado');
  });

  it('PATCH returns 404 for non-existent id', async () => {
    const orders = readOrdersFile();
    const first = orders[0];
    const session = { id: first.user.id, username: first.user.username };
    const cookie = `session=${encodeURIComponent(JSON.stringify(session))};`;

    const req = makeReq({ method: 'PATCH', url: 'http://localhost/api/user/orders', headers: { cookie }, body: { id: 'non-existent-id', action: 'mark_received' } });
    const res = await ordersRoute.PATCH(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('PATCH returns 400 for invalid action', async () => {
    const orders = readOrdersFile();
    const first = orders[0];
    const session = { id: first.user.id, username: first.user.username };
    const cookie = `session=${encodeURIComponent(JSON.stringify(session))};`;

    const req = makeReq({ method: 'PATCH', url: 'http://localhost/api/user/orders', headers: { cookie }, body: { id: first.id, action: 'do_magic' } });
    const res = await ordersRoute.PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
