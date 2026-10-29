# Mind

A calm, private space to talk to an AI companion, in English or Albanian. Next.js, TypeScript, Tailwind, Supabase.

A language switch (EN | SQ) changes the whole interface between English and Albanian.

Features: streaming chat with four AI companions (text or voice), long-term memory (session summaries), daily mood check-in with "what's affecting you" tags and Insights, a private journal, a 2-minute calm-down tool (breathing and 5-4-3-2-1 grounding), a personal safety plan, weekly letters from your companion, a crisis banner with your own contacts, "delete all my data", and a login so only you can see your data.

## Environment variables

Copy `.env.example` to `.env.local` for local use. On Vercel, add the same names under **Project Settings → Environment Variables**.

| Variable | Where it runs | What it is |
| --- | --- | --- |
| `LLM_API_KEY` | server only | Key for your AI provider. Free option: Groq ([console.groq.com/keys](https://console.groq.com/keys)). The same key is used for voice transcription (Whisper). |
| `LLM_BASE_URL` | server only | Any OpenAI-compatible endpoint. Groq: `https://api.groq.com/openai/v1`. |
| `LLM_MODEL` | server only | Model name, e.g. `openai/gpt-oss-120b` (Groq). Check your provider's current model list. |
| `LLM_REASONING_EFFORT` | server only | Optional. For reasoning models like Groq's `openai/gpt-oss-120b`, `low` keeps replies quick and natural. Leave it out for providers that don't support it. |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL, e.g. `https://abcd.supabase.co` (no `/rest/v1/`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase **anon / publishable** key. Public by design; Row Level Security protects the data. |
| `TTS_MODEL` | server only | Optional. Natural English voice for reading replies aloud. Default: Groq's `canopylabs/orpheus-v1-english` (accept its terms once in the Groq console). Albanian replies use the device's own voice. |
| `APP_LOCK_SECRET` | server only | Optional, for the app lock. Any long random string (32+ characters), kept secret. Without it, the app lock option is hidden. |

Never add the Supabase `service_role` / secret key. This app doesn't need it, and it would bypass all privacy rules.

## Setup

1. **Supabase project.** Create a free one at [supabase.com](https://supabase.com).
2. **Database.** In the SQL editor, run the files in `supabase/migrations/` in order:
   1. `20261026000000_memory.sql`
   2. `20261026000001_mood.sql`
   3. `20261026000002_privacy.sql` (owner columns and Row Level Security)
   4. `20261027000000_safety_plan.sql`
   5. `20261027000001_journal.sql`
   6. `20261027000002_mood_tags.sql`
   7. `20261027000003_weekly_letters.sql`
   8. `20261027000004_onboarding.sql`
   9. `20261028000000_guests.sql` (guests can't save journal, mood, memories or letters, and inactive guests are removed after 30 days)
   10. `20261029000000_reminder_and_app_lock.sql` (daily check-in reminder, and the optional 4-digit app lock)
3. **Sign-ups.** Authentication → Sign In / Providers → Email: turn **on** "Allow new users to sign up" and keep **"Confirm email"** on. People then create their own account at `/signup` and get a short welcome on first sign-in.
4. **Links in emails.** Authentication → URL Configuration: set **Site URL** to your app's address (e.g. `http://localhost:3001`, later your Vercel URL) and add `<your address>/auth/callback` under **Redirect URLs** (one per address you use).
5. **Email sending.** Supabase's built-in email only reaches your project's team members and a few emails per hour. Before inviting other people, add your own SMTP (Authentication → Emails → SMTP Settings), for example a free [Resend](https://resend.com) account.
   - *Optional, "Continue as guest":* Authentication → Sign In / Providers: turn on **Allow anonymous sign-ins**. A guest who makes an account gets the "Change email address" email; with custom SMTP, put `{{ .Token }}` in that template (like `confirm-signup.html`) so they can type the code. A link also works: it comes back through `/auth/callback` to choose a password. Until then the button explains that guest visits aren't switched on yet. Before going public, also turn on a CAPTCHA (Authentication → Attack Protection), since anyone can start a guest visit.
   - *Optional, "Continue with Google":* Authentication → Sign In / Providers → **Google**: turn it on and paste a Client ID and Secret from Google Cloud (APIs & Services → Credentials → OAuth client, type Web application, with `https://<your-project>.supabase.co/auth/v1/callback` as the authorized redirect URI). Until then the button explains that Google isn't switched on yet.
6. **Keys.** Project Settings → API: copy the URL and the anon/publishable key into `.env.local`.
7. **Run it.**

```bash
npm install
npm run dev
```

Open http://localhost:3000, create your account at `/signup` (or sign in), and follow the short welcome.

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
- **Guests** ("Continue as guest") can chat (20 messages a day), use the calm tools and set contacts. Journal, mood check-ins, memories, weekly letters and the safety plan need a free account; this is enforced in the API routes and in the database. Making an account keeps everything. Guests who haven't chatted for 30 days are deleted each night by a `pg_cron` job.
- **App lock** (Settings → Account & security): an optional 4-digit PIN to open Mind, for shared devices. The PIN is stored only as a bcrypt hash that no one can read back, 5 wrong tries mean a 5-minute wait, and it locks again after the chosen idle time. Forgot it? Sign out and sign in again with email or Google. Needs `APP_LOCK_SECRET` in the environment (see `.env.example`). It keeps out people nearby, not someone with technical access to an unlocked browser.
- **Daily check-in reminder** (Settings → Preferences): a "How are you today?" at a chosen time if there is no check-in yet. For now it arrives while Mind is open in a tab (even in the background); reminders with Mind fully closed need web push once the app is online.
- Your chat text is sent to the AI provider you configure. Check their data and privacy terms, since free tiers sometimes use data for training.

## Editing the companion

- `prompts/companion.ts`: personality and rules.
- `prompts/summary.ts`: how session memories are written.
- `prompts/insights.ts`: the "What patterns do you see?" reflection.
- `lib/crisis.ts`: phrases that trigger the banner.

This is a support tool, not therapy or medical care.
