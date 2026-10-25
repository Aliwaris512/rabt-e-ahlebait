create table if not exists public.islamic_occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 180),
  name_urdu text,
  hijri_month integer not null check (hijri_month between 1 and 12),
  hijri_day integer not null check (hijri_day between 1 and 30),
  description text,
  language text not null default 'en' check (language in ('en', 'ur', 'both')),
  source text not null,
  published boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.islamic_date_overrides (
  id uuid primary key default gen_random_uuid(),
  gregorian_date date not null,
  hijri_date text not null,
  hijri_year integer not null check (hijri_year between 1 and 2000),
  hijri_month integer not null check (hijri_month between 1 and 12),
  hijri_day integer not null check (hijri_day between 1 and 30),
  city_region text not null default 'Pakistan',
  confirmation_status text not null check (confirmation_status in ('verified', 'confirmed', 'awaiting_confirmation')),
  source text not null,
  reason text,
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique (gregorian_date, city_region)
);

create or replace function public.set_islamic_calendar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists islamic_occasions_set_updated_at on public.islamic_occasions;
create trigger islamic_occasions_set_updated_at
before update on public.islamic_occasions
for each row execute function public.set_islamic_calendar_updated_at();

drop trigger if exists islamic_date_overrides_set_updated_at on public.islamic_date_overrides;
create trigger islamic_date_overrides_set_updated_at
before update on public.islamic_date_overrides
for each row execute function public.set_islamic_calendar_updated_at();

alter table public.islamic_occasions enable row level security;
alter table public.islamic_date_overrides enable row level security;

revoke all on table public.islamic_occasions from anon, authenticated;
grant select on table public.islamic_occasions to anon, authenticated;
grant insert, update, delete on table public.islamic_occasions to authenticated;
revoke all on table public.islamic_date_overrides from anon, authenticated;
grant select on table public.islamic_date_overrides to anon, authenticated;
grant insert, update, delete on table public.islamic_date_overrides to authenticated;

drop policy if exists "Anyone can read published Islamic occasions" on public.islamic_occasions;
create policy "Anyone can read published Islamic occasions"
  on public.islamic_occasions for select
  to anon, authenticated
  using (published = true or public.is_announcement_admin());

drop policy if exists "Calendar admins can create occasions" on public.islamic_occasions;
create policy "Calendar admins can create occasions"
  on public.islamic_occasions for insert
  to authenticated
  with check (public.is_announcement_admin() and created_by = auth.uid());

drop policy if exists "Calendar admins can update occasions" on public.islamic_occasions;
create policy "Calendar admins can update occasions"
  on public.islamic_occasions for update
  to authenticated
  using (public.is_announcement_admin())
  with check (public.is_announcement_admin());

drop policy if exists "Calendar admins can delete occasions" on public.islamic_occasions;
create policy "Calendar admins can delete occasions"
  on public.islamic_occasions for delete
  to authenticated
  using (public.is_announcement_admin());

drop policy if exists "Anyone can read confirmed Islamic dates" on public.islamic_date_overrides;
create policy "Anyone can read confirmed Islamic dates"
  on public.islamic_date_overrides for select
  to anon, authenticated
  using (true);

drop policy if exists "Calendar admins can create date overrides" on public.islamic_date_overrides;
create policy "Calendar admins can create date overrides"
  on public.islamic_date_overrides for insert
  to authenticated
  with check (public.is_announcement_admin() and updated_by = auth.uid());

drop policy if exists "Calendar admins can update date overrides" on public.islamic_date_overrides;
create policy "Calendar admins can update date overrides"
  on public.islamic_date_overrides for update
  to authenticated
  using (public.is_announcement_admin())
  with check (public.is_announcement_admin() and updated_by = auth.uid());

drop policy if exists "Calendar admins can delete date overrides" on public.islamic_date_overrides;
create policy "Calendar admins can delete date overrides"
  on public.islamic_date_overrides for delete
  to authenticated
  using (public.is_announcement_admin());
