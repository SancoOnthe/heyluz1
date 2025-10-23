-- Supabase schema for WEBPERFUM
-- Run this script in Supabase SQL editor to create tables and recommended RLS policies.

-- 1) Profiles: store extra metadata for users
create table if not exists public.profiles (
  id uuid primary key,
  email text unique not null,
  name text,
  role text default 'user', -- possible values: 'user', 'editor', 'admin'
  avatar_url text,
  created_at timestamptz default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

-- 2) Products: id as text to accept numeric or uuid from local datasets
create table if not exists public.products (
  id text primary key,
  nombre text,
  title text,
  descripcion text,
  price numeric(12,2),
  precio numeric(12,2),
  categoria text,
  tags jsonb,
  img text,
  metadata jsonb,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_products_categoria on public.products(categoria);
create index if not exists idx_products_published on public.products(published);

-- 3) Orders
create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  total numeric(12,2) not null default 0,
  items jsonb,
  status text default 'pending', -- pending | pagado | enviado | cancelado
  shipping jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_orders_user on public.orders(user_id);

-- 4) app_users: optional application-level user store (hashed passwords)
create table if not exists public.app_users (
  id uuid primary key,
  email text unique not null,
  password text,
  user_metadata jsonb,
  created_at timestamptz default now()
);

-- Enable RLS to enforce row-level policies
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- ------------------ POLICIES ------------------
-- Products: public can SELECT only published products
create policy if not exists public_read_published_products on public.products
  for select using (published = true);

-- Products: editors and admins can insert/update/delete
create policy if not exists products_admin_manage on public.products
  for all using (auth.role() = 'admin' or auth.role() = 'editor') with check (auth.role() = 'admin' or auth.role() = 'editor');

-- Orders: allow authenticated users to insert
create policy if not exists insert_orders_for_authenticated on public.orders
  for insert using (auth.role() is not null) with check (auth.role() is not null);

-- Orders: owners can select/update their orders; admins can do anything
create policy if not exists orders_owner_or_admin_select on public.orders
  for select using (auth.uid()::text = user_id::text or auth.role() = 'admin');
create policy if not exists orders_owner_or_admin_update on public.orders
  for update using (auth.uid()::text = user_id::text or auth.role() = 'admin') with check (auth.uid()::text = user_id::text or auth.role() = 'admin');

-- Profiles: owner or admin can select/update
create policy if not exists profiles_is_owner_or_admin_select on public.profiles
  for select using (auth.uid()::text = id::text or auth.role() = 'admin');
create policy if not exists profiles_is_owner_or_admin_update on public.profiles
  for update using (auth.uid()::text = id::text or auth.role() = 'admin') with check (auth.uid()::text = id::text or auth.role() = 'admin');

-- Optional: grant limited access to anon role (careful, prefer policies above)
-- Example: allow anon to read published products via the policy already defined.

-- Note: Supabase Auth issues JWTs that expose auth.uid() and auth.role() claims. To map a profile.role into the JWT's role claim
-- you can use a server-side admin process to set custom claims (not covered here) or rely on policies that check profiles table values.

-- After running: review policies in Supabase Studio and adapt to your needs.
