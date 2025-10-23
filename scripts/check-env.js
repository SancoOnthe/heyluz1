// Comprueba las variables de entorno importantes para ejecutar la app y scripts de migración.
// Uso:
//   node ./scripts/check-env.js         -> comprobación por defecto (verifica vars básicas)
//   node ./scripts/check-env.js --strict -> comprobación estricta (incluye service role)

const argv = require('minimist')(process.argv.slice(2));
const strict = !!argv.strict || !!argv.s;

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL'
];

// En modo estrict o para migraciones recomendamos tener la service role key
if (strict) required.push('SUPABASE_SERVICE_ROLE_KEY');

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('\nMissing required environment variables:');
  missing.forEach(m => console.error('- ' + m));
  console.error('\nTip: create a .env.local from .env.example and fill values.');
  process.exitCode = 2;
} else {
  console.log('All required environment variables are set.');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\nNote: SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.log(' - This is OK for normal runtime (client + anon key).');
    console.log(' - To run migrations or admin scripts, set SUPABASE_SERVICE_ROLE_KEY in a secure place and use --strict to check it.');
  }
}
