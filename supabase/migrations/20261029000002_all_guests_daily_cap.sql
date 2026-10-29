-- A daily cap for all guests together, on top of each guest's own daily limit.
-- New guest accounts are cheap to make (Supabase allows a few per hour from one network), so a per-guest
-- limit alone can't protect the AI quota. This caps guest chat as a whole; accounts aren't affected.
-- Both limits live here, in the database, so nobody can pass in their own.

drop function if exists public.use_guest_message(int);
drop function if exists public.guest_messages_used();

create table if not exists public.guest_usage_total (
  day date primary key default current_date,
  messages int not null default 0
);
alter table public.guest_usage_total enable row level security; -- no policies: no direct access
revoke all on public.guest_usage_total from anon, authenticated;

-- The limits, in one place. Keep per_guest in step with GUEST_DAILY_MESSAGES in lib/guest.ts (shown in the app).
create or replace function public.guest_limits(out per_guest int, out all_guests int)
language sql
immutable
set search_path = ''
as $$
  select 20, 300;
$$;
revoke all on function public.guest_limits() from public, anon, authenticated;

-- Counts one guest message. Returns how many the guest has left after it,
-- -1 if they reached their own daily limit, or -2 if all guests together reached today's cap.
create or replace function public.use_guest_message()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim record;
  used int;
  total int;
begin
  if auth.uid() is null or not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'guests only';
  end if;
  select * into lim from public.guest_limits();

  insert into public.chat_usage as u (user_id, day, messages)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update
    set messages = u.messages + 1
    where u.messages < lim.per_guest
  returning u.messages into used;
  if used is null then
    return -1;
  end if;

  insert into public.guest_usage_total as t (day, messages)
  values (current_date, 1)
  on conflict (day) do update
    set messages = t.messages + 1
    where t.messages < lim.all_guests
  returning t.messages into total;
  if total is null then
    -- Today's guest cap is used up: this message doesn't count against the guest.
    update public.chat_usage set messages = messages - 1 where user_id = auth.uid() and day = current_date;
    return -2;
  end if;

  return greatest(lim.per_guest - used, 0);
end;
$$;

-- For the chat screen: messages left for this guest today, and whether guest chat is full for everyone.
create or replace function public.guest_chat_status()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'left', greatest(l.per_guest - coalesce((select messages from public.chat_usage where user_id = auth.uid() and day = current_date), 0), 0),
    'full', coalesce((select messages from public.guest_usage_total where day = current_date), 0) >= l.all_guests
  )
  from public.guest_limits() l;
$$;

revoke all on function public.use_guest_message(), public.guest_chat_status() from public, anon;
grant execute on function public.use_guest_message(), public.guest_chat_status() to authenticated;
