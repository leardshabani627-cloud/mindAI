-- Weekly letters: a short, warm look back at each week, written by the chosen AI companion.
-- Based on mood check-ins and conversation summaries only (never the journal).

create table public.weekly_letters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,                 -- the Monday of the week the letter looks back on
  companion  text not null default 'ela',   -- who wrote it (see prompts/companions.ts)
  body       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)              -- one letter per week
);

alter table public.weekly_letters enable row level security;

create policy "own rows" on public.weekly_letters
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.weekly_letters from anon;
grant select, insert, update, delete on public.weekly_letters to authenticated;
