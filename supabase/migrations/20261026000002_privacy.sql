-- Make every row private to the signed-in user. Run after the first two migrations.
--
-- Existing rows from before this migration have no owner (user_id is null) and become
-- invisible. To keep them, run this once after creating your user (Auth > Users > copy the UID):
--   update public.messages          set user_id = '<your-uid>' where user_id is null;
--   update public.session_summaries set user_id = '<your-uid>' where user_id is null;
--   update public.mood_entries      set user_id = '<your-uid>' where user_id is null;

-- 1. Owner column. New rows get the signed-in user's id automatically.
alter table public.messages          add column user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.session_summaries add column user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.mood_entries      add column user_id uuid references auth.users (id) on delete cascade default auth.uid();

create index messages_user_idx          on public.messages (user_id);
create index session_summaries_user_idx on public.session_summaries (user_id);

-- One mood check-in per user per day.
alter table public.mood_entries drop constraint if exists mood_entries_entry_date_key;
alter table public.mood_entries add constraint mood_entries_user_date_key unique (user_id, entry_date);

-- 2. Settings: emergency contacts, crisis resources and disclaimer acceptance. All user-defined.
create table public.user_settings (
  user_id                uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  emergency_contacts     jsonb not null default '[]',   -- [{ "name": "...", "detail": "..." }]
  crisis_resources       jsonb not null default '[]',   -- [{ "name": "...", "detail": "..." }]
  disclaimer_accepted_at timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- 3. Row Level Security: a signed-in user can only touch rows they own.
create policy "own rows" on public.messages
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.session_summaries
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.mood_entries
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The anonymous (logged-out) role gets nothing at all.
revoke all on public.messages, public.session_summaries, public.mood_entries, public.user_settings from anon;

-- 4. The app now runs as the signed-in user (no service key), so that user may call this.
--    The function is security invoker, so RLS still limits it to their own sessions.
grant execute on function public.stale_sessions(timestamptz, uuid, int) to authenticated;

-- 5. Signed-in users need table privileges for the policies above to apply to.
grant select, insert, update, delete on public.messages, public.session_summaries, public.mood_entries, public.user_settings to authenticated;
