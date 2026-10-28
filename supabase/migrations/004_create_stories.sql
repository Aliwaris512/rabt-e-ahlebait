create table if not exists public.story_categories (
  id uuid primary key default gen_random_uuid(),
  name_ur text not null check (char_length(btrim(name_ur)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description_ur text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.story_categories(id) on delete restrict,
  title_ur text not null check (char_length(btrim(title_ur)) between 1 and 220),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt_ur text not null check (char_length(btrim(excerpt_ur)) between 1 and 600),
  content_ur text not null check (char_length(btrim(content_ur)) between 1 and 200000),
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  historical_notes_ur text,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.story_sources (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  source_title text not null check (char_length(btrim(source_title)) between 1 and 240),
  author_name text,
  source_type text,
  volume text,
  page text,
  hadith_or_report_number text,
  source_url text,
  citation_note_ur text,
  narration_status text,
  created_at timestamptz not null default now()
);

create index if not exists stories_published_created_idx on public.stories (published_at desc, created_at desc) where status = 'published';
create index if not exists stories_category_idx on public.stories (category_id, published_at desc);
create index if not exists stories_featured_idx on public.stories (featured, published_at desc) where status = 'published';
create index if not exists story_sources_story_idx on public.story_sources (story_id);

create or replace function public.set_story_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') and new.published_at is null then
    new.published_at = now();
  elsif new.status = 'draft' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at before update on public.stories for each row execute function public.set_story_updated_at();

alter table public.story_categories enable row level security;
alter table public.stories enable row level security;
alter table public.story_sources enable row level security;

revoke all on table public.story_categories, public.stories, public.story_sources from anon, authenticated;
grant select on table public.story_categories, public.stories, public.story_sources to anon, authenticated;
grant insert, update, delete on table public.story_categories, public.stories, public.story_sources to authenticated;

drop policy if exists "Anyone can read story categories" on public.story_categories;
create policy "Anyone can read story categories" on public.story_categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage story categories" on public.story_categories;
create policy "Admins manage story categories" on public.story_categories for all to authenticated using (public.is_announcement_admin()) with check (public.is_announcement_admin());

drop policy if exists "Anyone can read published stories" on public.stories;
create policy "Anyone can read published stories" on public.stories for select to anon, authenticated using (status = 'published' or public.is_announcement_admin());
drop policy if exists "Admins manage stories" on public.stories;
create policy "Admins manage stories" on public.stories for all to authenticated using (public.is_announcement_admin()) with check (public.is_announcement_admin());

drop policy if exists "Anyone can read sources for published stories" on public.story_sources;
create policy "Anyone can read sources for published stories" on public.story_sources for select to anon, authenticated using (
  exists (select 1 from public.stories s where s.id = story_id and (s.status = 'published' or public.is_announcement_admin()))
);
drop policy if exists "Admins manage story sources" on public.story_sources;
create policy "Admins manage story sources" on public.story_sources for all to authenticated using (public.is_announcement_admin()) with check (public.is_announcement_admin());

insert into public.story_categories (name_ur, slug, description_ur, display_order) values
  ('واقعاتِ کربلا', 'waqiat-e-karbala', 'کربلا کے واقعات، پس منظر اور زندہ پیغام', 1),
  ('سیرتِ حضرت فاطمہ زہرا (س)', 'seerat-fatima-zahra', 'سیدہ طاہرہؑ کی پاکیزہ سیرت اور تعلیمات', 2),
  ('سیرتِ امام علی (ع)', 'seerat-imam-ali', 'امیرالمؤمنینؑ کی سیرت، عدل اور علم', 3),
  ('سیرتِ امام حسن (ع)', 'seerat-imam-hasan', 'امام حسن مجتبیٰؑ کی حکمت اور صبر', 4),
  ('سیرتِ اہلِ بیت (ع)', 'seerat-ahlebait', 'اہلِ بیتؑ کی مشترکہ تعلیمات', 5),
  ('سیرتِ رسولِ اکرم (ص)', 'seerat-rasool-akram', 'رسولِ اکرم ﷺ کی سیرتِ مبارکہ', 6),
  ('اسلامی تاریخ و واقعات', 'islamic-history', 'اسلامی تاریخ کے اہم واقعات', 7),
  ('اخلاقی و سبق آموز حکایات', 'akhlaqi-hikayat', 'کردار سازی اور اخلاقی تربیت', 8)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('story-covers', 'story-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view published story covers" on storage.objects;
create policy "Anyone can view published story covers" on storage.objects for select to anon, authenticated using (
  bucket_id = 'story-covers' and exists (
    select 1 from public.stories s
    where s.id::text = split_part(name, '/', 1) and (s.status = 'published' or public.is_announcement_admin())
  )
);
drop policy if exists "Admins upload story covers" on storage.objects;
create policy "Admins upload story covers" on storage.objects for insert to authenticated with check (bucket_id = 'story-covers' and public.is_announcement_admin());
drop policy if exists "Admins update story covers" on storage.objects;
create policy "Admins update story covers" on storage.objects for update to authenticated using (bucket_id = 'story-covers' and public.is_announcement_admin()) with check (bucket_id = 'story-covers' and public.is_announcement_admin());
drop policy if exists "Admins delete story covers" on storage.objects;
create policy "Admins delete story covers" on storage.objects for delete to authenticated using (bucket_id = 'story-covers' and public.is_announcement_admin());
