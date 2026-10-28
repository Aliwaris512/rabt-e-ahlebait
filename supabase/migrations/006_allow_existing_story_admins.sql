drop policy if exists "Admins manage stories" on public.stories;
create policy "Admins manage stories"
  on public.stories
  for all
  to authenticated
  using (public.is_announcement_admin())
  with check (public.is_announcement_admin());
