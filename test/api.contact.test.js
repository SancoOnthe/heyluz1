import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'messages.json');

// Importar handlers
import * as handlers from '../src/app/api/contact/route.js';

// Mock cookies() from next/headers used in handlers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name) => null
  })
}));

async function readFileSafe() {
  try { return JSON.parse(await fs.readFile(DATA_PATH, 'utf8')); } catch { return []; }
}

beforeEach(async () => {
  // Backup existing data
  try {
    await fs.copyFile(DATA_PATH, DATA_PATH + '.bak');
  } catch { }
  await fs.writeFile(DATA_PATH, '[]', 'utf8');
});

afterEach(async () => {
  // Restore backup if exists
  try {
    await fs.copyFile(DATA_PATH + '.bak', DATA_PATH);
    await fs.unlink(DATA_PATH + '.bak');
  } catch { }
});

describe('API /api/contact handlers', () => {
  it('POST creates a new message', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'Test', email: 't@test.com', asunto: 'consulta', mensaje: 'Hola' })
    });

    const res = await handlers.POST(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id');

    const arr = await readFileSafe();
    expect(arr.length).toBe(1);
    expect(arr[0].email).toBe('t@test.com');
  });

  it('GET by email rejects when no session', async () => {
    const req = new Request('http://localhost/api/contact?email=t@test.com');
    const res = await handlers.GET(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(res.status).toBe(401);
  });
});
