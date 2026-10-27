-- Personal safety plan (Stanley-Brown Safety Plan), written by the user.
-- Lives with the other settings, so the same Row Level Security applies: only its owner can see it.
-- Shape: { "reasons": [], "warning_signs": [], "coping": [], "distractions": [], "safe_steps": [] }
-- (people to ask for help and crisis lines are the existing emergency_contacts / crisis_resources)

alter table public.user_settings add column safety_plan jsonb not null default '{}';
