















-- Supabase-ready SQL schema
-- Purpose: create core tables and Row Level Security (RLS) policies
-- Safe defaults for an app with roles: 'admin', 'editor', 'user'
-- Run in Supabase SQL editor (Studio) on a fresh database or staging environment.

/* IMPORTANT NOTES:
 - Do NOT run this against production without a backup.
 - Review and adapt policies to your exact business rules before enabling in prod.
 - Keep the SUPABASE_SERVICE_ROLE_KEY secret; it's only required for server-side admin operations.
*/

-- 1) Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2) Utility: updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) profiles: one row per user identity
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  role text not null default 'user', -- enum-like: admin|editor|user
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

-- trigger for profiles updated_at
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 4) products: catalog items
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'USD',
  metadata jsonb default '{}'::jsonb,
  public boolean default false, -- visible to public
  stock integer default 0 check (stock >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_public on public.products(public);

-- trigger for products updated_at
drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- 5) orders: simple order model
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  profile_id uuid references public.profiles(id) on delete set null,
  items jsonb not null default '[]'::jsonb, -- array of {product_id, qty, price}
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'pending', -- pending|paid|shipped|cancelled
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_profile on public.orders(profile_id);

-- trigger for orders updated_at
drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- 6) app_users: optional table for legacy/local users (only if needed)
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text, -- only used for local backfills; prefer Supabase Auth
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_email on public.app_users(email);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

-- 7) Helper function to check role in JWT claims
-- Supabase sets jwt.claims.role for custom roles if configured in Auth
-- Helper: determine role by looking up the profiles table for the current auth.uid()
-- This is more reliable than depending on jwt.claims.role being set.
create or replace function public.auth_is_role(p_role text)
returns boolean language sql stable as $$
select exists(
  select 1 from public.profiles p
  where p.auth_id::text = auth.uid()::text and p.role = p_role
);
$$;

-- 8) Enable Row Level Security (RLS) and policies
-- Profiles: users can read and update their own profile; admins can read/update any.
alter table public.profiles enable row level security;

-- Allow reading public profiles if requester is the owner or admin
create policy "profiles_read_own_or_admin" on public.profiles
for select using (
  auth.uid()::text = auth_id::text or public.auth_is_role('admin')
);

-- Allow insert: only server (service role) or signup flow (allow for authenticated)
create policy "profiles_insert_authenticated" on public.profiles
for insert with check (
  auth.uid()::text = auth_id::text or public.auth_is_role('admin')
);

-- Allow update: owner or admin
create policy "profiles_update_own_or_admin" on public.profiles
for update using (
  auth.uid()::text = auth_id::text or public.auth_is_role('admin')
) with check (
  auth.uid()::text = auth_id::text or public.auth_is_role('admin')
);

-- Products: public can select rows where public = true; editors and admins can manage
alter table public.products enable row level security;

create policy "products_public_select" on public.products
for select using (
  public = true
);

create policy "products_editor_admin_manage" on public.products
for all using (
  public.auth_is_role('admin') or public.auth_is_role('editor')
) with check (
  public.auth_is_role('admin') or public.auth_is_role('editor')
);

-- Orders: users can create orders (auth.uid must match profile.auth_id), read own orders; admins can read all
alter table public.orders enable row level security;

-- Allow authenticated users to insert orders if profile_id belongs to them or admin
create policy "orders_insert_owner_or_admin" on public.orders
for insert with check (
  auth.uid()::text = (select auth_id::text from public.profiles where id = profile_id) or public.auth_is_role('admin')
);

-- Allow select: owner or admin
create policy "orders_select_owner_or_admin" on public.orders
for select using (
  auth.uid()::text = (select auth_id::text from public.profiles where id = profile_id) or public.auth_is_role('admin')
);

-- Allow update: admin or owner (for status updates owner may be restricted)
create policy "orders_update_owner_or_admin" on public.orders
for update using (
  auth.uid()::text = (select auth_id::text from public.profiles where id = profile_id) or public.auth_is_role('admin')
) with check (
  auth.uid()::text = (select auth_id::text from public.profiles where id = profile_id) or public.auth_is_role('admin')
);

-- App users: keep RLS strict (only service role can manage in most cases)
alter table public.app_users enable row level security;

create policy "app_users_service_role_only" on public.app_users
for all using (public.auth_is_role('admin'));

-- 9) Safety indexes and optional views
-- Create a compact orders view for faster reads (optional)
-- Create or replace the orders summary view (drop then create to be explicit)
drop view if exists public.v_orders_summary;
create view public.v_orders_summary as
select
  o.id,
  o.order_number,
  o.profile_id,
  p.email as profile_email,
  o.total,
  o.status,
  o.created_at
from public.orders o
left join public.profiles p on p.id = o.profile_id;

-- 10) Final notes
comment on table public.profiles is 'User profiles mapped to auth.users';
comment on table public.products is 'Catalog products';
comment on table public.orders is 'Customer orders';
comment on table public.app_users is 'Legacy/local users - prefer Supabase Auth instead';

-- End of schema
