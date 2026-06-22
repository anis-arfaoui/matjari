-- Run this once in Supabase SQL Editor after store-schema.sql.
-- It creates products, options, variants, orders, and a product-images storage bucket.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  current_price numeric not null check (current_price >= 0),
  old_price numeric check (old_price >= 0),
  main_image_url text,
  main_image_path text,
  additional_images jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

alter table public.products add column if not exists additional_images jsonb not null default '[]'::jsonb;

alter table public.products enable row level security;

drop policy if exists "Users can view their own products" on public.products;
create policy "Users can view their own products"
on public.products
for select
to authenticated
using (exists (
  select 1 from public.stores where stores.id = products.store_id and stores.user_id = auth.uid()
));

drop policy if exists "Users can create their own products" on public.products;
create policy "Users can create their own products"
on public.products
for insert
to authenticated
with check (exists (
  select 1 from public.stores where stores.id = products.store_id and stores.user_id = auth.uid()
));

drop policy if exists "Users can update their own products" on public.products;
create policy "Users can update their own products"
on public.products
for update
to authenticated
using (exists (
  select 1 from public.stores where stores.id = products.store_id and stores.user_id = auth.uid()
))
with check (exists (
  select 1 from public.stores where stores.id = products.store_id and stores.user_id = auth.uid()
));

drop policy if exists "Users can delete their own products" on public.products;
create policy "Users can delete their own products"
on public.products
for delete
to authenticated
using (exists (
  select 1 from public.stores where stores.id = products.store_id and stores.user_id = auth.uid()
));

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  values text[] not null,
  created_at timestamptz not null default now()
);

alter table public.product_options enable row level security;

drop policy if exists "Users can manage their own product options" on public.product_options;
create policy "Users can manage their own product options"
on public.product_options
for all
to authenticated
using (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = product_options.product_id and stores.user_id = auth.uid()
))
with check (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = product_options.product_id and stores.user_id = auth.uid()
));

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_values jsonb not null default '{}',
  current_price numeric,
  old_price numeric,
  image_url text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

drop policy if exists "Users can manage their own product variants" on public.product_variants;
create policy "Users can manage their own product variants"
on public.product_variants
for all
to authenticated
using (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = product_variants.product_id and stores.user_id = auth.uid()
))
with check (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = product_variants.product_id and stores.user_id = auth.uid()
));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  customer_name text not null,
  phone text not null,
  wilaya_code text not null,
  wilaya_name text not null,
  baladiya text not null,
  delivery_method text not null check (delivery_method in ('home', 'office')),
  quantity integer not null default 1 check (quantity >= 1),
  status text not null default 'new' check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders
for select
to authenticated
using (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = orders.product_id and stores.user_id = auth.uid()
));

drop policy if exists "Users can update their own orders" on public.orders;
create policy "Users can update their own orders"
on public.orders
for update
to authenticated
using (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = orders.product_id and stores.user_id = auth.uid()
))
with check (exists (
  select 1 from public.products
  join public.stores on stores.id = products.store_id
  where products.id = orders.product_id and stores.user_id = auth.uid()
));

-- Public read access for products and variants via store slug (used on public pages).
-- We use a function to check whether a product belongs to a public store.

create or replace function public.is_product_public(product_uuid uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.products
    join public.stores on stores.id = products.store_id
    where products.id = product_uuid
  );
$$;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
to public
using (status = 'active' and is_product_public(id));

drop policy if exists "Public can view product options" on public.product_options;
create policy "Public can view product options"
on public.product_options
for select
to public
using (exists (
  select 1 from public.products where products.id = product_options.product_id and products.status = 'active'
));

drop policy if exists "Public can view product variants" on public.product_variants;
create policy "Public can view product variants"
on public.product_variants
for select
to public
using (exists (
  select 1 from public.products where products.id = product_variants.product_id and products.status = 'active'
));

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
to public
with check (exists (
  select 1 from public.products where products.id = orders.product_id and products.status = 'active'
));

drop policy if exists "Authenticated users can create orders" on public.orders;
create policy "Authenticated users can create orders"
on public.orders
for insert
to authenticated
with check (exists (
  select 1 from public.products where products.id = orders.product_id and products.status = 'active'
));

-- Storage bucket for product images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Users can upload their own product images" on storage.objects;
create policy "Users can upload their own product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own product images" on storage.objects;
create policy "Users can delete their own product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
