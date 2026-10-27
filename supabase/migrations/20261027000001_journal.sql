-- Private journal: free writing, never sent to the AI.

create table public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  tag        text not null default 'free' check (tag in ('reflection', 'gratitude', 'checkin', 'free')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

-- Same rule as everything else: only the owner can see or change their entries.
alter table public.journal_entries enable row level security;

create policy "own rows" on public.journal_entries
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.journal_entries from anon;
grant select, insert, update, delete on public.journal_entries to authenticated;
