create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  review text not null check (char_length(btrim(review)) between 5 and 2000),
  suggestion text check (suggestion is null or char_length(suggestion) <= 2000),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.reviews
  alter column status set default 'approved';

alter table public.reviews enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert on table public.reviews to anon, authenticated;
revoke update, delete, truncate, references on table public.reviews from anon, authenticated;

drop policy if exists "Anyone can read approved reviews" on public.reviews;
create policy "Anyone can read approved reviews"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Anyone can submit pending reviews" on public.reviews;
drop policy if exists "Anyone can submit public reviews" on public.reviews;
create policy "Anyone can submit public reviews"
  on public.reviews for insert
  to anon, authenticated
  with check (status = 'approved');
