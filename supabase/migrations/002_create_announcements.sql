create table if not exists public.announcement_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_announcement_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.announcement_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_announcement_admin() from public;
grant execute on function public.is_announcement_admin() to anon, authenticated;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text check (title is null or char_length(btrim(title)) between 1 and 180),
  content text not null check (char_length(btrim(content)) between 1 and 10000),
  image_path text,
  event_at timestamptz,
  published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_announcement_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_announcement_updated_at();

alter table public.announcement_admins enable row level security;
alter table public.announcements enable row level security;

revoke all on table public.announcement_admins from anon, authenticated;
grant select on table public.announcement_admins to authenticated;
revoke all on table public.announcements from anon, authenticated;
grant select on table public.announcements to anon, authenticated;
grant insert, update, delete on table public.announcements to authenticated;

drop policy if exists "Admins can view admin membership" on public.announcement_admins;
create policy "Admins can view admin membership"
  on public.announcement_admins for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can read published announcements" on public.announcements;
create policy "Anyone can read published announcements"
  on public.announcements for select
  to anon, authenticated
  using (published = true or public.is_announcement_admin());

drop policy if exists "Admins can create announcements" on public.announcements;
create policy "Admins can create announcements"
  on public.announcements for insert
  to authenticated
  with check (public.is_announcement_admin() and created_by = auth.uid());

drop policy if exists "Admins can update announcements" on public.announcements;
create policy "Admins can update announcements"
  on public.announcements for update
  to authenticated
  using (public.is_announcement_admin())
  with check (public.is_announcement_admin());

drop policy if exists "Admins can delete announcements" on public.announcements;
create policy "Admins can delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_announcement_admin());

insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view announcement images" on storage.objects;
create policy "Anyone can view announcement images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'announcements');

drop policy if exists "Admins can upload announcement images" on storage.objects;
create policy "Admins can upload announcement images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'announcements' and public.is_announcement_admin());

drop policy if exists "Admins can update announcement images" on storage.objects;
create policy "Admins can update announcement images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'announcements' and public.is_announcement_admin())
  with check (bucket_id = 'announcements' and public.is_announcement_admin());

drop policy if exists "Admins can delete announcement images" on storage.objects;
create policy "Admins can delete announcement images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'announcements' and public.is_announcement_admin());
