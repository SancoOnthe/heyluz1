-- Esquema de ejemplo para Supabase

-- Tabla profiles
create table if not exists profiles (
  id uuid primary key,
  email text not null unique,
  name text,
  role text default 'user'
);

-- Tabla users (si no usas Supabase Auth)
create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password text,
  user_metadata jsonb
);

-- Tabla products
create table if not exists products (
  id uuid primary key,
  title text,
  description text,
  price numeric,
  published boolean default false,
  metadata jsonb
);

-- Tabla orders
create table if not exists orders (
  id uuid primary key,
  user_id uuid references profiles(id),
  items jsonb,
  total numeric,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Ejemplo de política RLS mínima (activar manualmente en Supabase):
-- Enable RLS then create policies according to your needs. Example:
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public select" ON products FOR SELECT USING (true);
