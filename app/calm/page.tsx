"use client";

import Link from "next/link";
import { useState } from "react";
import Breathing from "@/components/calm/Breathing";
import Grounding from "@/components/calm/Grounding";
import TopMenu from "@/components/TopMenu";
import { useCopy } from "@/lib/i18n";

const MODES = ["breathe", "ground"] as const;

const en = {
  modes: { breathe: "Breathe", ground: "5-4-3-2-1" },
  backHome: "Back to home",
  title: "Take a moment",
  subtitle: "Two minutes, just for you.",
  danger: "If you feel in danger, call your local emergency number or someone you trust.",
};
const COPY = {
  en,
  sq: {
    modes: { breathe: "Frymëmarrje", ground: "5-4-3-2-1" },
    backHome: "Kthehu në ballinë",
    title: "Merr një moment",
    subtitle: "Dy minuta, vetëm për ty.",
    danger: "Nëse ndihesh në rrezik, telefono numrin lokal të urgjencës ose dikë që i beson.",
  } satisfies typeof en,
};

// "Take a moment": quick calming exercises that work without the AI or the internet.
export default function CalmPage() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<(typeof MODES)[number]>("breathe");

  return (
    <main className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="glass animate-rise flex min-h-[38rem] w-full max-w-xl flex-col rounded-[2.25rem] p-5 sm:p-7">
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
          <TopMenu current="/calm" />
        </header>

        <div className="mt-5 flex self-center rounded-full bg-[var(--accent-soft)] p-1" role="tablist">
          {MODES.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={
                "rounded-full px-5 py-1.5 text-sm transition " +
                (mode === m ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--fg)]/80")
              }
            >
              {t.modes[m]}
            </button>
          ))}
        </div>

        {mode === "breathe" ? <Breathing key="breathe" /> : <Grounding key="ground" />}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          {t.danger}
        </p>
      </div>
    </main>
  );
}
