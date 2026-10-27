-- What's affecting the day, chosen at check-in (e.g. {'sleep','work'}). Ids are listed in lib/moodTags.ts.
alter table public.mood_entries add column tags text[] not null default '{}';
