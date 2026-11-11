-- Memory notes are written in the third person ("They felt…") because the companion reads them as notes
-- about the person. The person sees the same note written to them ("You felt…"): stored here.
alter table public.session_summaries add column if not exists summary_you text;
