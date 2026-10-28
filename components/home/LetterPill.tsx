"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWeek, letterWeekStart } from "@/lib/dates";
import { useCopy, useLang } from "@/lib/i18n";

const en = {
  writing: (name: string) => `${name} is writing your weekly letter…`,
  letterFrom: (name: string) => `A letter from ${name}`,
  forYourWeek: "for your week",
  yourLetter: "Your weekly letter",
  isNew: "new",
};
const COPY = {
  en,
  sq: {
    writing: (name: string) => `${name} po të shkruan letrën e javës…`,
    letterFrom: (name: string) => `Një letër nga ${name}`,
    forYourWeek: "për javën tënde",
    yourLetter: "Letra jote e javës",
    isNew: "e re",
  } satisfies typeof en,
};

// Small note on the home screen about this week's letter. The letter is written quietly in the background
// the first time Mind is opened that week (on Sunday it covers the week ending; later, the last full week).
export const LETTER_READ_KEY = "mind-letter-read"; // which week's letter was last opened (this device)
const EMPTY_KEY = "mind-letter-empty"; // a week with nothing to write about: don't ask again

type State = "hidden" | "writing" | "ready" | "read";

export default function LetterPill({ companionId, companionName }: { companionId: string; companionName: string }) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [state, setState] = useState<State>("hidden");
  const [week, setWeek] = useState("");

  useEffect(() => {
    const weekStart = letterWeekStart();
    setWeek(weekStart);
    const stored = (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    };
    const shown = () => setState(stored(LETTER_READ_KEY) === weekStart ? "read" : "ready");

    (async () => {
      const list = await fetch("/api/letters").then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (!list) return;
      if (list.letters.some((l: { week_start: string }) => l.week_start === weekStart)) return shown();
      if (stored(EMPTY_KEY) === weekStart) return;

      setState("writing");
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, companion: companionId, lang }),
      }).catch(() => null);
      const result = res ? await res.json().catch(() => null) : null;
      if (result?.letter) return shown();
      if (result?.empty) {
        try {
          localStorage.setItem(EMPTY_KEY, weekStart);
        } catch {}
      }
      setState("hidden"); // nothing to say this week, or it'll try again next time
    })();
    // Written once per visit, by whichever companion is chosen at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "hidden") return null;

  return (
    <Link
      href="/letters"
      className={
        "glass mt-2 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:-translate-y-0.5 " +
        (state === "writing" ? "pointer-events-none opacity-80" : "")
      }
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
      {state === "writing" && <span className="animate-pulse">{t.writing(companionName)}</span>}
      {state === "ready" && (
        <span>
          <span className="font-medium">{t.letterFrom(companionName)}</span> {t.forYourWeek} · {formatWeek(week, lang)}
        </span>
      )}
      {state === "read" && <span>{t.yourLetter} · {formatWeek(week, lang)}</span>}
      {state === "ready" && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-label={t.isNew} />}
    </Link>
  );
}
