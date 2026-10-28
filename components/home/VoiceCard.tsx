"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Waveform from "@/components/Waveform";
import { useCopy } from "@/lib/i18n";
import { setStartVoice } from "@/lib/pending";

const en = {
  title: "Talk to Mind",
  subtitle: "Say anything, in English or shqip.",
  startSpeaking: "Start speaking",
  open: "Open the conversation",
  continue: "Continue our conversation…",
  placeholder: "How are you feeling today? Type here or dictate",
  monthTitle: "Memories saved this month",
  perMonth: "/Month",
};
const COPY = {
  en,
  sq: {
    title: "Fol me Mind",
    subtitle: "Thuaj çfarëdo, shqip ose anglisht.",
    startSpeaking: "Fillo të flasësh",
    open: "Hap bisedën",
    continue: "Vazhdo bisedën tonë…",
    placeholder: "Si po ndihesh sot? Shkruaj ose fol këtu",
    monthTitle: "Kujtime të ruajtura këtë muaj",
    perMonth: "/Muaj",
  } satisfies typeof en,
};

// The way in. Tap the mic to open the chat already listening, or tap the box to open it ready to type.
export default function VoiceCard({ hasConversation, monthCount }: { hasConversation: boolean; monthCount: number }) {
  const router = useRouter();
  const t = useCopy(COPY);

  function openListening() {
    setStartVoice();
    router.push("/chat");
  }

  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--voice-from)] to-[var(--voice-to)] p-5 text-white shadow-[0_24px_60px_-30px_rgba(40,70,40,0.7)] transition hover:-translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal tracking-tight">{t.title}</h2>
          <p className="text-sm text-white/90">{t.subtitle}</p>
        </div>
        <button
          onClick={openListening}
          aria-label={t.startSpeaking}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[var(--voice-from)] shadow-md transition hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      </div>

      <Link href="/chat" aria-label={t.open} className="relative my-4 flex-1 content-center">
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
          {hasConversation ? t.continue : t.placeholder}
        </span>
        <span className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-4 text-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="flex items-center gap-1.5" title={t.monthTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-[var(--muted)]">
                <path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              </svg>
              <span className="font-medium">{monthCount}</span>
              <span className="text-[var(--muted)]">{t.perMonth}</span>
            </span>
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-soft)] text-white transition group-hover:bg-[var(--accent)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </span>
        </span>
      </Link>
    </section>
  );
}
