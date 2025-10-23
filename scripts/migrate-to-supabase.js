#!/usr/bin/env node
/**
 * Simple migration helper: lee src/data/users.json y src/data/profiles.json
 * y los inserta en Supabase usando SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *  node ./scripts/migrate-to-supabase.js --dry-run
 *  node ./scripts/migrate-to-supabase.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const skipAuth = args.includes('--skip-auth') || args.includes('-s');
  const verbose = args.includes('--verbose') || args.includes('-v');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  let supabase = null;
  if (!dryRun) {
    if (!url || !serviceKey) {
      console.error('Faltan variables de entorno. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_KEY).');
      console.error('Si solo quieres inspeccionar los datos localmente, ejecuta con --dry-run.');
      process.exit(1);
    }

    let createClient;
    try {
      createClient = require('@supabase/supabase-js').createClient;
    } catch (err) {
      console.error('No se pudo cargar @supabase/supabase-js. Ejecuta `npm install` primero.');
      process.exit(1);
    }

    supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  const dataDir = path.resolve(process.cwd(), 'src', 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const profilesFile = path.join(dataDir, 'profiles.json');
  const productsJsonFile = path.join(dataDir, 'products.json');
  const productsJsFile = path.join(dataDir, 'products.js');
  const ordersFile = path.join(dataDir, 'orders.json');

  function readJSON(file) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    } catch (e) {
      console.error('Error leyendo', file, e.message);
      return [];
    }
  }

  // Load a JS data file that uses `export const X = ...` by writing a temporary CJS wrapper
  function loadJsData(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Replace `export const NAME =` with `module.exports.NAME =`
      const transformed = content.replace(/export\s+const\s+(\w+)\s*=\s*/g, 'module.exports.$1 = ');
      const tmpName = path.join(os.tmpdir(), `migrate-data-${crypto.randomBytes(6).toString('hex')}.cjs`);
      fs.writeFileSync(tmpName, transformed, 'utf8');
      const loaded = require(tmpName);
      // clean up
      try { fs.unlinkSync(tmpName); } catch (e) { /* ignore */ }
      return loaded;
    } catch (e) {
      console.warn('No se pudo cargar', filePath, e && e.message);
      return {};
    }
  }

  const users = fs.existsSync(usersFile) ? readJSON(usersFile) : [];
  const profiles = fs.existsSync(profilesFile) ? readJSON(profilesFile) : [];
  let products = [];
  if (fs.existsSync(productsJsonFile)) {
    products = readJSON(productsJsonFile);
  } else if (fs.existsSync(productsJsFile)) {
    const mod = loadJsData(productsJsFile);
    // support named export PRODUCTS or default
    if (mod && mod.PRODUCTS) products = mod.PRODUCTS;
    else if (Array.isArray(mod)) products = mod;
  }
  const orders = fs.existsSync(ordersFile) ? readJSON(ordersFile) : [];

  console.log(`Found ${users.length} users and ${profiles.length} profiles`);
  console.log(`Found ${products.length} products and ${orders.length} orders`);
  if (dryRun) {
    console.log('Dry run enabled. Listing samples:');
    console.log('Users sample:', users.slice(0, 3));
    console.log('Profiles sample:', profiles.slice(0, 3));
    console.log('Products sample:', products.slice(0, 5));
    console.log('Orders sample:', orders.slice(0, 2));
    console.log('\nFlags: ', { skipAuth, verbose });
    process.exit(0);
  }

  // Insert profiles first (so foreign keys can reference them)
  if (profiles.length > 0) {
    console.log('Inserting profiles...');
    const { data, error } = await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting profiles:', error.message || error);
      process.exit(2);
    }
    console.log(`Inserted/updated ${data?.length ?? profiles.length} profiles`);
  }

  if (users.length > 0) {
    console.log('Processing users...');
    const bcrypt = require('bcryptjs');

    // If we have a service client (supabase created with service role), prefer
    // to create users in Supabase Auth via admin API, then upsert profiles.
    if (!skipAuth && supabase && supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.createUser === 'function') {
      console.log('Using Supabase admin API to create/update users');
      for (const u of users) {
        try {
          const opts = { email: u.email, password: String(u.password || Math.random().toString(36).slice(-8)), user_metadata: u.user_metadata || { name: u.user_metadata?.name } };
          const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser(opts);
          if (adminErr) {
            // If user exists, try to find the user id via admin.listUsers
            if (adminErr.message && adminErr.message.toLowerCase().includes('already')) {
              console.log(`User ${u.email} already exists, attempting to locate id`);
              try {
                const listRes = await supabase.auth.admin.listUsers();
                const found = (listRes && listRes.data && listRes.data.users || []).find(x => x.email === u.email);
                const existingId = found?.id;
                if (existingId) {
                  // upsert profile with this id
                  await supabase.from('profiles').upsert({ id: existingId, email: u.email, name: u.user_metadata?.name || u.email.split('@')[0], role: 'user' }, { onConflict: 'id' });
                  console.log(`Updated profile for existing user ${u.email}`);
                  continue;
                }
              } catch (e) {
                console.warn('Could not list users to find existing id:', e && e.message);
              }
            }
            console.error('Error creating user via admin API:', adminErr);
            continue;
          }

          const newId = adminData?.user?.id;
          if (newId) {
            // upsert profile
            await supabase.from('profiles').upsert({ id: newId, email: u.email, name: u.user_metadata?.name || u.email.split('@')[0], role: 'user' }, { onConflict: 'id' });
            console.log(`Created user ${u.email} with id ${newId}`);
          }
        } catch (e) {
          console.error('Error processing user', u.email, e && e.message);
        }
      }
    } else {
      if (skipAuth) console.log('--skip-auth passed: skipping Supabase admin API even if available');
      console.log('No Supabase admin client available - falling back to upserting hashed passwords into app table');
      const usersToInsert = users.map(u => {
        const copy = { ...u };
        try {
          if (copy.password && !copy.password.startsWith('$2a$') && !copy.password.startsWith('$2b$')) {
            copy.password = bcrypt.hashSync(String(copy.password), 10);
          }
        } catch (e) {
          console.warn('Hashing warning for user', copy.email, e && e.message);
        }
        return copy;
      });

      const { data, error } = await supabase.from('app_users').upsert(usersToInsert, { onConflict: 'id' });
      if (error) {
        console.error('Error inserting app_users:', error.message || error);
        process.exit(3);
      }
      console.log(`Inserted/updated ${data?.length ?? usersToInsert.length} app_users`);
    }
  }

  if (products.length > 0) {
    console.log('Inserting products...');
    const { data, error } = await supabase.from('products').upsert(products, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting products:', error.message || error);
    } else {
      console.log(`Inserted/updated ${data?.length ?? products.length} products`);
    }
  }

  if (orders.length > 0) {
    console.log('Inserting orders...');
    const { data, error } = await supabase.from('orders').upsert(orders, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting orders:', error.message || error);
    } else {
      console.log(`Inserted/updated ${data?.length ?? orders.length} orders`);
    }
  }

  console.log('Migración completada. Revisa en Supabase Studio que los datos estén correctos.');
}

main().catch(err => {
  console.error('Migration script error:', err && err.message ? err.message : err);
  process.exit(99);
});
