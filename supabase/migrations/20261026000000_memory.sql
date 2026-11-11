-- Long-term memory for Mind.
-- Run in the Supabase SQL editor, or with `supabase db push`.

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index messages_session_created_idx on public.messages (session_id, created_at);

create table public.session_summaries (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,          -- one summary per session
  summary    text not null,
  themes     text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index session_summaries_created_idx on public.session_summaries (created_at desc);

-- Private data: turn on row level security and add NO policies.
-- Only the server (service role key) can read or write these tables;
-- the public anon key gets nothing.
alter table public.messages enable row level security;
alter table public.session_summaries enable row level security;

-- Sessions that went quiet before cutoff, have enough content, and were never summarized.
-- (min_user_messages must match MIN_USER_MESSAGES in lib/memory.ts.)
create function public.stale_sessions(
  cutoff timestamptz,
  exclude_session uuid default null,
  min_user_messages int default 2
)
returns table (session_id uuid)
language sql
stable
set search_path = public
as $$
  select m.session_id
  from public.messages m
  where (exclude_session is null or m.session_id <> exclude_session)
    and not exists (
      select 1 from public.session_summaries s where s.session_id = m.session_id
    )
  group by m.session_id
  having max(m.created_at) < cutoff
     and count(*) filter (where m.role = 'user') >= min_user_messages
$$;

revoke execute on function public.stale_sessions(timestamptz, uuid, int) from public, anon, authenticated;
