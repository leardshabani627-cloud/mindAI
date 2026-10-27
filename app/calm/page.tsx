"use client";

import Link from "next/link";
import { useState } from "react";
import Breathing from "@/components/calm/Breathing";
import Grounding from "@/components/calm/Grounding";
import TopMenu from "@/components/TopMenu";

const MODES = [
  { id: "breathe", label: "Breathe" },
  { id: "ground", label: "5-4-3-2-1" },
] as const;

// "Take a moment": quick calming exercises that work without the AI or the internet.
export default function CalmPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("breathe");

  return (
    <main className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="glass animate-rise flex min-h-[38rem] w-full max-w-xl flex-col rounded-[2.25rem] p-5 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label="Back to home"
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight">Take a moment</h1>
              <p className="text-sm text-[var(--muted)]">Merr një moment. Two minutes, just for you.</p>
            </div>
          </div>
          <TopMenu current="/calm" />
        </header>

        <div className="mt-5 flex self-center rounded-full bg-[var(--accent-soft)] p-1" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={
                "rounded-full px-5 py-1.5 text-sm transition " +
                (mode === m.id ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--fg)]/80")
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "breathe" ? <Breathing key="breathe" /> : <Grounding key="ground" />}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          If you feel in danger, call your local emergency number or someone you trust.
        </p>
      </div>
    </main>
  );
}
