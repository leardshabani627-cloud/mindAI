# Mind

**A calm, private space to talk.** · *Një hapësirë e qetë dhe private për të folur.*

Mind is a web app for the in-between moments: when you want to talk something through, notice how you're doing, or calm down for two minutes. You talk with an AI companion that listens like a good therapist would: short, warm, curious about your life, never preachy. Everything is private to you, and the whole app works in English and Albanian.

## Features

- **Talk, by text or voice.** Four AI companions with their own way of talking, replies that feel like a real conversation, and a hands-free *Live* mode, like a call.
- **Memory.** After a conversation, Mind keeps a short note of what mattered, so the next talk picks up where you left off. You can read and delete every note.
- **Daily check-in.** Five faces and a few tags ("sleep", "work"…), with your week at a glance and *Insights* that show what tends to lift or lower your mood.
- **Private journal.** Your own writing, with gentle prompts. Never sent to the AI.
- **Calm tools.** Guided breathing and the 5-4-3-2-1 grounding exercise, available any time.
- **Safety first.** A personal safety plan, a *Help* button on every page with emergency numbers for your country, and a check that notices when a message may signal danger.
- **Weekly letters** from your companion about your week.
- **English | Shqip** with one switch, and a guest mode to try it without an account.

## Privacy and safety

- Only you can see your data. Every table is protected at the database level, not just in the app.
- Your journal is never sent to the AI. Conversations are sent to the AI provider only to write replies.
- You can delete everything, at any time, from Settings.
- Mind is an **AI companion, not a therapist, doctor or emergency service**. It never diagnoses. If you're in danger, call your local emergency number or someone you trust.

## Built with

Next.js · TypeScript · Tailwind CSS · Supabase (auth and Postgres with Row Level Security) · an OpenAI-compatible AI provider (Groq by default) for chat, voice and speech.

## Run it yourself

1. Create a free [Supabase](https://supabase.com) project and run the SQL files in `supabase/migrations/`, in order, in its SQL editor.
2. Copy `.env.example` to `.env.local` and fill it in. Every setting is explained in that file.
3. Install and start:

```bash
npm install
npm run dev
```

Then open the address shown in the terminal and create your account.

---

*Mind is a personal project. It is not a medical device and does not replace professional care.*
