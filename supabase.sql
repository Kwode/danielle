-- Run this in Supabase SQL Editor.
-- Cloudinary remains the media/file store; Supabase stores metadata only.

create table if not exists public.photos (
  id text primary key,
  url text not null,
  caption text not null default '',
  date text,
  location text,
  category text,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id text primary key,
  title text not null,
  url text not null default '',
  poster text,
  duration text,
  description text,
  date text,
  is_custom boolean not null default true,
  file_size bigint,
  mime_type text,
  cloudinary_public_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.music_tracks (
  id text primary key,
  title text not null,
  artist text not null,
  type text not null,
  url text,
  youtube_id text,
  duration text not null default 'Track',
  created_at timestamptz not null default now()
);

create table if not exists public.deleted_items (
  id text primary key,
  deleted_at timestamptz not null default now()
);

-- This app is a public birthday site. These policies allow the current
-- client-side behavior to work without Firebase Auth.
alter table public.photos enable row level security;
alter table public.videos enable row level security;
alter table public.music_tracks enable row level security;
alter table public.deleted_items enable row level security;

drop policy if exists "public read photos" on public.photos;
drop policy if exists "public write photos" on public.photos;
drop policy if exists "public insert photos" on public.photos;
drop policy if exists "public update photos" on public.photos;
create policy "public read photos" on public.photos for select using (true);
create policy "public insert photos" on public.photos for insert with check (true);
create policy "public update photos" on public.photos for update using (true) with check (true);
-- No DELETE policy: uploaded photos are permanent.

drop policy if exists "public read videos" on public.videos;
drop policy if exists "public write videos" on public.videos;
drop policy if exists "public insert videos" on public.videos;
drop policy if exists "public update videos" on public.videos;
create policy "public read videos" on public.videos for select using (true);
create policy "public insert videos" on public.videos for insert with check (true);
create policy "public update videos" on public.videos for update using (true) with check (true);
-- No DELETE policy: uploaded videos are permanent.

drop policy if exists "public read music_tracks" on public.music_tracks;
drop policy if exists "public write music_tracks" on public.music_tracks;
create policy "public read music_tracks" on public.music_tracks for select using (true);
create policy "public write music_tracks" on public.music_tracks for all using (true) with check (true);

drop policy if exists "public read deleted_items" on public.deleted_items;
drop policy if exists "public write deleted_items" on public.deleted_items;
create policy "public read deleted_items" on public.deleted_items for select using (true);
create policy "public write deleted_items" on public.deleted_items for all using (true) with check (true);

-- Enable Supabase Realtime for the tables used by the UI.
alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.music_tracks;
alter publication supabase_realtime add table public.deleted_items;
