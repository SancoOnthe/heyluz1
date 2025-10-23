import fs from 'fs';
import path from 'path';
let supabase = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { dbClient } = require('@/lib/dbClient');
  supabase = dbClient;
} catch (e) {
  supabase = null;
}

export const dynamic = 'force-dynamic';

function readProductsFile() {
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'products.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    }
    // try products.js
    const jsFile = path.join(process.cwd(), 'src', 'data', 'products.js');
    if (fs.existsSync(jsFile)) {
      // load as CJS temporary
      const content = fs.readFileSync(jsFile, 'utf8');
      const transformed = content.replace(/export\s+const\s+(\w+)\s*=\s*/g, 'module.exports.$1 = ');
      const tmp = path.join(require('os').tmpdir(), `products-${Date.now()}.cjs`);
      fs.writeFileSync(tmp, transformed, 'utf8');
      const mod = require(tmp);
      try { fs.unlinkSync(tmp); } catch (e) {}
      return mod && mod.PRODUCTS ? mod.PRODUCTS : [];
    }
  } catch (e) {
    console.warn('Could not load products from file', e && e.message);
  }
  return [];
}

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) {
        console.error('Supabase products error', error);
        return new Response(JSON.stringify({ ok: false, error: 'DB error' }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true, data: data || [] }), { status: 200 });
    }

    const products = readProductsFile();
    return new Response(JSON.stringify({ ok: true, data: products }), { status: 200 });
  } catch (e) {
    console.error('Products API error', e);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500 });
  }
}
