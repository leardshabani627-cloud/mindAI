-- Sign-up and first-run welcome.
-- display_name: what Mind calls you (optional). onboarded_at: when the welcome steps were finished.

alter table public.user_settings add column display_name text;
alter table public.user_settings add column onboarded_at timestamptz;

-- People who were already using Mind before the welcome steps existed don't need to see them.
update public.user_settings set onboarded_at = coalesce(disclaimer_accepted_at, now()) where onboarded_at is null;
