-- Daily mood check-ins. Run after 20261026000000_memory.sql.

create table public.mood_entries (
  id         uuid primary key default gen_random_uuid(),
  entry_date date not null unique,                       -- one check-in per day (your local date)
  mood       smallint not null check (mood between 1 and 10),
  note       text not null default '',
  created_at timestamptz not null default now()
);

-- Private data: RLS on, no policies. Only the server (service role key) can access it.
alter table public.mood_entries enable row level security;
