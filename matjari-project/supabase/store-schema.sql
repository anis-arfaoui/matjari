-- Run this once in Supabase SQL Editor after auth-schema.sql.
-- It creates the seller store table and a public logo storage bucket.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_url text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stores add column if not exists description text;

alter table public.stores enable row level security;

drop policy if exists "Users can view their own store" on public.stores;
create policy "Users can view their own store"
on public.stores
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own store" on public.stores;
create policy "Users can create their own store"
on public.stores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own store" on public.stores;
create policy "Users can update their own store"
on public.stores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-logos',
  'store-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Store logos are publicly readable" on storage.objects;
create policy "Store logos are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'store-logos');

drop policy if exists "Users can upload their own store logo" on storage.objects;
create policy "Users can upload their own store logo"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'store-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
