-- A tamper-proof daily message counter for guests.
-- Before: the limit counted the guest's own saved messages, which they could delete to reset it.
-- Now: a separate counter that nobody can read or change directly; it only goes up, through the function below.

create table if not exists public.chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  messages int not null default 0,
  primary key (user_id, day)
);
alter table public.chat_usage enable row level security; -- no policies: no direct access at all
revoke all on public.chat_usage from anon, authenticated;

-- Counts one message for the signed-in person today, unless they're already at the limit.
-- Returns how many are left after this one, or -1 when the limit was already reached.
-- In one statement, so two messages sent at the same moment can't both slip past the limit.
create or replace function public.use_guest_message(daily_limit int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into public.chat_usage as u (user_id, day, messages)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update
    set messages = u.messages + 1
    where u.messages < daily_limit
  returning u.messages into used;
  if used is null then
    return -1;
  end if;
  return greatest(daily_limit - used, 0);
end;
$$;

-- How many messages the signed-in person has used today (read-only).
create or replace function public.guest_messages_used()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select messages from public.chat_usage where user_id = auth.uid() and day = current_date), 0);
$$;

revoke all on function public.use_guest_message(int), public.guest_messages_used() from public, anon;
grant execute on function public.use_guest_message(int), public.guest_messages_used() to authenticated;
