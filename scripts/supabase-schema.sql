-- Supabase minimal schema for WEBPERFUM
-- Run this in Supabase SQL editor to create tables and basic RLS policies.

-- profiles table: additional metadata about users
create table if not exists public.profiles (
  id uuid primary key,
  email text unique not null,
  name text,
  role text default 'user',
  created_at timestamptz default now()
);

-- products table
-- Products: adaptado a los campos del proyecto local (id puede ser numérico o uuid)
create table if not exists public.products (
  id text primary key,
  nombre text,
  title text,
  descripcion text,
  price numeric(10,2),
  precio numeric(10,2),
  categoria text,
  tags jsonb,
  img text,
  metadata jsonb,
  published boolean default true,
  created_at timestamptz default now()
);

-- orders table
create table if not exists public.orders (
  id uuid primary key,
  user_id uuid references public.profiles(id),
  total numeric(10,2) not null default 0,
  items jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Optional users table for application-level user data (avoid duplicating auth.users)
create table if not exists public.app_users (
  id uuid primary key,
  email text unique not null,
  password text,
  user_metadata jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on tables where appropriate
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- Example policy: allow anyone to read published products
create policy "public_read_published_products" on public.products
  for select using (published = true);

-- Policy: allow any authenticated user to insert orders
create policy "insert_orders_for_authenticated" on public.orders
  for insert using (auth.uid() is not null) with check (auth.uid() is not null);

-- Policy: owners can read their orders; admins can read all
create policy "orders_owner_or_admin" on public.orders
  for select using (auth.uid() = user_id or auth.role() = 'admin');

-- Example policy: allow authenticated users (with valid JWT) to insert orders
create policy "insert_orders_for_authenticated" on public.orders
  for insert using (auth.role() is not null) with check (auth.role() is not null);

-- Example policy: profiles can be read by the owner or by admins
create policy "profiles_is_owner_or_admin" on public.profiles
  for select using (auth.uid() = id or auth.role() = 'admin');

-- Note: adjust policies to your needs. Supabase Auth provides claims like auth.uid() and auth.role().
