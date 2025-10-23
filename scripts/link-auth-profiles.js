#!/usr/bin/env node
/*
  scripts/link-auth-profiles.js
  - Connects to Supabase using SUPABASE_SERVICE_ROLE_KEY
  - Lists users from Auth and upserts rows into public.profiles with auth_id
  - Supports --dry-run and --verbose

  Usage:
    node ./scripts/link-auth-profiles.js --dry-run --verbose
*/

const { createClient } = (() => {
  try {
    return require('@supabase/supabase-js');
  } catch (err) {
    console.error('Por favor instala @supabase/supabase-js (npm i @supabase/supabase-js)');
    process.exit(1);
  }
})();

const argv = require('minimist')(process.argv.slice(2));
const DRY = !!argv['dry-run'] || !!argv['dryrun'] || !!argv['d'];
const VERBOSE = !!argv.verbose || !!argv.v;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Debes exportar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu entorno.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listAuthUsers() {
  // paginar usuarios
  const users = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: limit, page: Math.floor(offset / limit) + 1 });
    if (error) throw error;
    if (!data || !data.users) break;
    users.push(...data.users);
    if (data.users.length < limit) break;
    offset += data.users.length;
  }
  return users;
}

async function upsertProfiles(users) {
  // Map users -> profiles rows
  const rows = users.map(u => ({
    auth_id: u.id,
    email: u.email || null,
    full_name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || null,
    avatar_url: (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) || null,
    role: 'user',
    metadata: JSON.stringify(u.user_metadata || {}),
  }));

  if (DRY) {
    console.log('[dry-run] Prepared', rows.length, 'profile upserts');
    if (VERBOSE) console.dir(rows, { depth: 2 });
    return { inserted: 0, upserted: rows.length };
  }

  // Use upsert via table insert with on conflict (supabase-js upsert)
  const { data, error } = await supabase.from('profiles').upsert(rows, { onConflict: 'auth_id' }).select('*');
  if (error) throw error;
  return { upserted: data.length };
}

(async function main() {
  try {
    console.log('Connecting to Supabase:', SUPABASE_URL);

    const users = await listAuthUsers();
    console.log('Found', users.length, 'auth.users');
    if (VERBOSE) console.log(users.slice(0, 5));

    const result = await upsertProfiles(users);
    console.log('Result:', result);
    console.log('Done.');
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(3);
  }
})();
