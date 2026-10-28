-- Guests: people who try Mind without an account (Supabase anonymous sign-in).
-- Guests may chat (with a daily limit, enforced by the app), use the calm tools and save settings.
-- Journal, mood check-ins, memories and weekly letters need a real account, enforced here in the
-- database too, so nothing can be saved there by going around the app.

-- "Restrictive" policies are added on top of the existing "own rows" ones: both must pass.
create policy "accounts only" on public.journal_entries
  as restrictive for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "accounts only" on public.mood_entries
  as restrictive for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "accounts only" on public.session_summaries
  as restrictive for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "accounts only" on public.weekly_letters
  as restrictive for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

-- Tidy up: every night, remove guest accounts with no messages in the last 30 days.
-- Their rows go with them (every table references auth.users with "on delete cascade").
create extension if not exists pg_cron;

select cron.schedule(
  'delete-inactive-guests',
  '0 3 * * *',
  $$
    delete from auth.users u
    where u.is_anonymous = true
      and u.created_at < now() - interval '30 days'
      and not exists (
        select 1 from public.messages m where m.user_id = u.id and m.created_at > now() - interval '30 days'
      )
  $$
);
