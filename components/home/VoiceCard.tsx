"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Waveform from "@/components/Waveform";
import { setStartVoice } from "@/lib/pending";

// The way in. Tap the mic to open the chat already listening, or tap the box to open it ready to type.
export default function VoiceCard({ hasConversation }: { hasConversation: boolean }) {
  const router = useRouter();

  function openListening() {
    setStartVoice();
    router.push("/chat");
  }

  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--voice-from)] to-[var(--voice-to)] p-5 text-white shadow-[0_24px_60px_-30px_rgba(40,70,40,0.7)] transition hover:-translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Talk to Mind</h2>
          <p className="text-sm text-white/90">Say anything, in English or shqip.</p>
        </div>
        <button
          onClick={openListening}
          aria-label="Start speaking"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[var(--voice-from)] shadow-md transition hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      </div>

      <Link href="/chat" aria-label="Open the conversation" className="relative my-4 flex-1 content-center">
        <Waveform levels={[]} active={false} />
      </Link>

      <div className="relative mb-4 flex items-center justify-between text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]">
        <span>EN · SQ</span>
        <span className="tabular-nums">00:00</span>
      </div>

      <Link
        href="/chat"
        className="relative block rounded-3xl bg-[var(--card-solid)] p-4 text-[var(--fg)] shadow-lg transition group-hover:shadow-xl"
      >
        <span className="block min-h-[3rem] text-base text-[var(--muted)]">
          How are you feeling today? Type here or dictate
        </span>
        <span className="mt-2 flex items-center justify-between">
          <span className="text-sm text-[var(--accent)]">
            {hasConversation ? "Continue our conversation →" : "Private, only for you"}
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </span>
        </span>
      </Link>
    </section>
  );
}
