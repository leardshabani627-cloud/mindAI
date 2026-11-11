-- Daily check-in reminder (a time the person picks) and an optional 4-digit app lock.

alter table public.user_settings
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_time text not null default '20:00'
    check (reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- The PIN is stored only as a bcrypt hash, in a table nobody can read directly (no policies):
-- the functions below are the only way in, so the hash can't be fetched and guessed offline.
create table if not exists public.app_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pin_hash text not null,
  failed_attempts int not null default 0,
  wait_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.app_locks enable row level security;
revoke all on public.app_locks from anon, authenticated;

-- Set or change my PIN. Accounts only (a guest couldn't sign back in if they forgot it).
create or replace function public.set_app_lock(pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'not allowed';
  end if;
  if pin !~ '^[0-9]{4}$' then
    raise exception 'pin must be 4 digits';
  end if;
  insert into public.app_locks (user_id, pin_hash)
  values (auth.uid(), extensions.crypt(pin, extensions.gen_salt('bf')))
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0, wait_until = null, updated_at = now();
end;
$$;

-- Turn the lock off.
create or replace function public.clear_app_lock()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.app_locks where user_id = auth.uid();
$$;

-- Check a PIN: 'ok', 'wrong', 'wait' (too many tries: 5 wrong in a row means a 5-minute pause) or 'none'.
create or replace function public.check_app_lock(pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  lock public.app_locks;
begin
  select * into lock from public.app_locks where user_id = auth.uid() for update;
  if not found then
    return 'none';
  end if;
  if lock.wait_until is not null and lock.wait_until > now() then
    return 'wait';
  end if;
  if extensions.crypt(pin, lock.pin_hash) = lock.pin_hash then
    update public.app_locks set failed_attempts = 0, wait_until = null where user_id = auth.uid();
    return 'ok';
  end if;
  if lock.failed_attempts + 1 >= 5 then
    update public.app_locks set failed_attempts = 0, wait_until = now() + interval '5 minutes' where user_id = auth.uid();
    return 'wait';
  end if;
  update public.app_locks set failed_attempts = failed_attempts + 1 where user_id = auth.uid();
  return 'wrong';
end;
$$;

revoke all on function public.set_app_lock(text), public.clear_app_lock(), public.check_app_lock(text) from public, anon;
grant execute on function public.set_app_lock(text), public.clear_app_lock(), public.check_app_lock(text) to authenticated;
