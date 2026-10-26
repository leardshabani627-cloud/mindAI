# Mind

A calm, private space to talk to an AI companion, in English or Albanian. Next.js, TypeScript, Tailwind, Supabase.

Features: streaming chat, long-term memory (session summaries), daily mood check-in and Insights, a crisis banner with your own contacts, "delete all my data", and a login so only you can see your data.

## Environment variables

Copy `.env.example` to `.env.local` for local use. On Vercel, add the same names under **Project Settings → Environment Variables**.

| Variable | Where it runs | What it is |
| --- | --- | --- |
| `LLM_API_KEY` | server only | Key for your AI provider. Free option: Google Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)). |
| `LLM_BASE_URL` | server only | Any OpenAI-compatible endpoint. Default: `https://generativelanguage.googleapis.com/v1beta/openai`. |
| `LLM_MODEL` | server only | Model name, e.g. `gemini-2.5-flash` or `llama-3.3-70b-versatile` (Groq). |
| `LLM_REASONING_EFFORT` | server only | Optional. For reasoning models like Groq's `openai/gpt-oss-120b`, `low` keeps replies quick and natural. Leave it out for providers that don't support it. |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL, e.g. `https://abcd.supabase.co` (no `/rest/v1/`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase **anon / publishable** key. Public by design; Row Level Security protects the data. |

Never add the Supabase `service_role` / secret key. This app doesn't need it, and it would bypass all privacy rules.

## Setup

1. **Supabase project.** Create a free one at [supabase.com](https://supabase.com).
2. **Database.** In the SQL editor, run the files in `supabase/migrations/` in order:
   1. `20261026000000_memory.sql`
   2. `20261026000001_mood.sql`
   3. `20261026000002_privacy.sql` (owner columns and Row Level Security)
3. **Your login.** Authentication → Users → **Add user** → enter your email and a strong password, and tick *Auto Confirm User*.
4. **Close sign-ups.** Authentication → Sign In / Providers → turn **off** "Allow new users to sign up". The app has no sign-up page, and this stops anyone else creating an account.
5. **Keys.** Project Settings → API: copy the URL and the anon/publishable key into `.env.local`.
6. **Run it.**

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

## Deploy to Vercel

1. Put the project in a Git repository and push it. `.env.local` is already git-ignored.
2. In Vercel, **Add New → Project**, import the repository (framework: Next.js, nothing to change).
3. Add the five environment variables above, then deploy.
4. Supabase → Authentication → URL Configuration: set **Site URL** to your Vercel URL.

## Privacy and safety

- Every table has Row Level Security: a signed-in user can only read and write their own rows, and logged-out visitors get nothing. Every page and API route also requires a login.
- AI keys stay on the server. The browser only talks to this app's own API routes.
- **Settings** lets you enter your own trusted people and crisis resources (nothing is hardcoded). They appear in a gentle banner when a message looks like self-harm or hopelessness, and the companion can point to them. The detection is a simple phrase list in `lib/crisis.ts`, so it will miss things. It's a safety net, not a guarantee.
- **Settings → Delete all my data** erases your conversations, memories, mood entries and settings. It keeps the login itself; remove that under Authentication → Users.
- Your chat text is sent to the AI provider you configure. Check their data and privacy terms, since free tiers sometimes use data for training.

## Editing the companion

- `prompts/companion.ts`: personality and rules.
- `prompts/summary.ts`: how session memories are written.
- `prompts/insights.ts`: the "What patterns do you see?" reflection.
- `lib/crisis.ts`: phrases that trigger the banner.

This is a support tool, not therapy or medical care.
