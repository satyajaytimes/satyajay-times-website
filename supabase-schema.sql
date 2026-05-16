create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text,
  caption text,
  image_url text,
  video_url text,
  is_breaking boolean default false,
  is_featured boolean default false,
  is_published boolean default true,
  author text,
  tags text,
  created_at timestamptz default now()
);

create table if not exists ticker (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists epapers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issue_date date not null,
  image_url text,
  pdf_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Storage buckets. Run in Supabase SQL editor if buckets do not already exist.
insert into storage.buckets (id, name, public) values
  ('article-images', 'article-images', true),
  ('epaper-images', 'epaper-images', true),
  ('epaper-pdfs', 'epaper-pdfs', true)
on conflict (id) do nothing;

-- Basic RLS setup: public can read published/active content; authenticated users manage admin data.
alter table articles enable row level security;
alter table ticker enable row level security;
alter table epapers enable row level security;

create policy "Public read published articles" on articles for select using (is_published = true);
create policy "Admins manage articles" on articles for all to authenticated using (true) with check (true);
create policy "Public read active ticker" on ticker for select using (is_active = true);
create policy "Admins manage ticker" on ticker for all to authenticated using (true) with check (true);
create policy "Public read active epapers" on epapers for select using (is_active = true);
create policy "Admins manage epapers" on epapers for all to authenticated using (true) with check (true);

create policy "Public read article images" on storage.objects for select using (bucket_id in ('article-images', 'epaper-images', 'epaper-pdfs'));
create policy "Authenticated upload files" on storage.objects for insert to authenticated with check (bucket_id in ('article-images', 'epaper-images', 'epaper-pdfs'));
create policy "Authenticated update files" on storage.objects for update to authenticated using (bucket_id in ('article-images', 'epaper-images', 'epaper-pdfs')) with check (bucket_id in ('article-images', 'epaper-images', 'epaper-pdfs'));
create policy "Authenticated delete files" on storage.objects for delete to authenticated using (bucket_id in ('article-images', 'epaper-images', 'epaper-pdfs'));
