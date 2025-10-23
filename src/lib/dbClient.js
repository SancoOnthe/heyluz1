// dbClient: requiere que las variables de entorno de Supabase estén definidas.
// Si faltan, el proceso lanzará un error claro para forzar la configuración.
/* eslint-disable no-console */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error('Missing Supabase configuration: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_KEY)');
}

// eslint-disable-next-line import/no-extraneous-dependencies
const { createClient } = require('@supabase/supabase-js');

const dbClient = createClient(url, anonKey, { auth: { persistSession: false } });
let _serviceClient = null;
if (serviceKey) {
  _serviceClient = createClient(url, serviceKey, { auth: { persistSession: false } });
}

console.log('[dbClient] Supabase client initialized (strict mode)');

export { dbClient };

export function getServiceClient() {
  return _serviceClient || dbClient;
}
