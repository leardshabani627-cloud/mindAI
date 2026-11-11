"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LETTER_READ_KEY } from "@/components/home/LetterPill";
import Portrait from "@/components/Portrait";
import TopMenu from "@/components/TopMenu";
import { formatWeek, letterWeekStart } from "@/lib/dates";
import { COMPANION_KEY, getCompanion } from "@/prompts/companions";
import { useCopy, useLang } from "@/lib/i18n";

const en = {
  backHome: "Back to home",
  title: "Weekly letters",
  subtitle: "A gentle look back at each week.",
  letterFrom: (name: string) => `A letter from ${name}`,
  yourWeek: "Your week",
  ai: "AI companion",
  noneTitle: "No letters yet",
  noneText:
    "Each week, your companion writes you a short letter about how the week went, from your check-ins and conversations (never your journal). The first one arrives after a week with a few check-ins.",
  writing: "Writing…",
  writeFor: (week: string) => `Write the letter for ${week}`,
  reply: "Reply in a chat",
  deleteLetter: "Delete this letter",
  confirmDelete: "Delete this letter? This can't be undone.",
  empty: "Nothing to look back on for that week yet. Check in or talk with your companion, and try again.",
  writeFailed: "Couldn't write it right now. Please try again in a minute.",
  deleteFailed: "Couldn't delete it. Please try again.",
};
const COPY = {
  en,
  sq: {
    backHome: "Kthehu në ballinë",
    title: "Letrat e javës",
    subtitle: "Një vështrim i butë pas në çdo javë.",
    letterFrom: (name: string) => `Një letër nga ${name}`,
    yourWeek: "Java jote",
    ai: "Shoqërues AI",
    noneTitle: "Ende asnjë letër",
    noneText:
      "Çdo javë, shoqëruesi yt të shkruan një letër të shkurtër për si shkoi java, nga kontrollet e gjendjes dhe bisedat (kurrë nga ditari). E para vjen pas një jave me disa kontrolle.",
    writing: "Po shkruhet…",
    writeFor: (week: string) => `Shkruaje letrën për ${week}`,
    reply: "Përgjigju në bisedë",
    deleteLetter: "Fshije këtë letër",
    confirmDelete: "Ta fshijmë këtë letër? Kjo nuk kthehet më.",
    empty: "Ende s'ka asgjë për atë javë. Bëj një kontroll ose fol me shoqëruesin, pastaj provo përsëri.",
    writeFailed: "Nuk u shkrua dot tani. Provo përsëri pas një minute.",
    deleteFailed: "Nuk u fshi. Provo përsëri.",
  } satisfies typeof en,
};

type Letter = { id: string; week_start: string; companion: string; body: string; created_at: string };

// Weekly letters: a warm look back at each week, from your companion.
export default function LettersPage() {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [writing, setWriting] = useState(false);
  const [status, setStatus] = useState("");
  const [targetWeek, setTargetWeek] = useState("");

  useEffect(() => {
    setTargetWeek(letterWeekStart());
    fetch("/api/letters")
      .then((r) => (r.ok ? r.json() : { letters: [] }))
      .then((data) => {
        setLetters(data.letters);
        setSelected(data.letters[0]?.id ?? null);
      })
      .finally(() => setLoaded(true));
  }, []);

  const letter = letters.find((l) => l.id === selected) ?? null;
  const missingThisWeek = loaded && targetWeek && !letters.some((l) => l.week_start === targetWeek);

  // Opening a letter marks it as read on this device (the home screen stops showing "new").
  useEffect(() => {
    if (!letter) return;
    try {
      if (letter.week_start >= (localStorage.getItem(LETTER_READ_KEY) ?? "")) {
        localStorage.setItem(LETTER_READ_KEY, letter.week_start);
      }
    } catch {}
  }, [letter]);

  async function writeNow() {
    setWriting(true);
    setStatus("");
    let companion = "ela";
    try {
      companion = localStorage.getItem(COMPANION_KEY) ?? "ela";
    } catch {}
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: targetWeek, companion, lang }),
    }).catch(() => null);
    const result = res ? await res.json().catch(() => null) : null;
    setWriting(false);
    if (result?.letter) {
      setLetters((prev) => [result.letter, ...prev.filter((l) => l.id !== result.letter.id)]);
      setSelected(result.letter.id);
    } else if (result?.empty) {
      setStatus(t.empty);
    } else {
      setStatus(t.writeFailed);
    }
  }

  async function remove(l: Letter) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/letters/${l.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setStatus(t.deleteFailed);
    const rest = letters.filter((x) => x.id !== l.id);
    setLetters(rest);
    setSelected(rest[0]?.id ?? null);
  }

  const companion = letter ? getCompanion(letter.companion) : null;

  return (
    <main className="flex min-h-dvh justify-center p-3 sm:p-6">
      <div className="glass animate-rise flex w-full max-w-2xl flex-col rounded-[2.25rem] p-5 sm:p-8">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label={t.backHome}
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight">{t.title}</h1>
              <p className="text-sm text-[var(--muted)]">{t.subtitle}</p>
            </div>
          </div>
          <TopMenu current="/letters" />
        </header>

        {letters.length > 1 && (
          <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
            {letters.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l.id)}
                className={
                  "shrink-0 rounded-full px-3 py-1 text-sm " +
                  (l.id === selected ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]")
                }
              >
                {formatWeek(l.week_start, lang)}
              </button>
            ))}
          </div>
        )}

        {letter && companion && (
          <article className="mt-6 rounded-3xl bg-[var(--card-solid)] px-6 py-7 shadow-[0_20px_50px_-30px_rgba(40,70,40,0.5)] sm:px-9 sm:py-9">
            <div className="mb-6 flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-end overflow-hidden rounded-full"
                style={{ background: `linear-gradient(160deg, ${companion.look.bg[0]}, ${companion.look.bg[1]})` }}
              >
                <Portrait companion={companion} variant="round" />
              </span>
              <span>
                <span className="block">{t.letterFrom(companion.name)}</span>
                <span className="block text-sm text-[var(--muted)]">
                  {t.yourWeek} · {formatWeek(letter.week_start, lang)} · {t.ai}
                </span>
              </span>
            </div>
            <p className="whitespace-pre-wrap text-[1.075rem] leading-[1.9]">{letter.body}</p>
          </article>
        )}

        {loaded && letters.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-xl tracking-tight">{t.noneTitle}</p>
            <p className="mx-auto mt-1 max-w-md text-[var(--muted)]">
              {t.noneText}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {missingThisWeek && (
            <button
              onClick={writeNow}
              disabled={writing}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)] disabled:opacity-50"
            >
              {writing ? t.writing : t.writeFor(formatWeek(targetWeek, lang))}
            </button>
          )}
          {letter && (
            <>
              <Link href="/chat" className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
                {t.reply}
              </Link>
              <button onClick={() => remove(letter)} className="text-sm text-[var(--muted)] hover:text-red-600">
                {t.deleteLetter}
              </button>
            </>
          )}
          <span className="text-sm text-[var(--muted)]">{status}</span>
        </div>
      </div>
    </main>
  );
}
