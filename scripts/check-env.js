const required = [
  'NEXT_PUBLIC_API_URL',
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET'
];

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(m => console.error('- ' + m));
  process.exitCode = 2;
} else {
  console.log('All required environment variables are set.');
}
