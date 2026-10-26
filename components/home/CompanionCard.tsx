"use client";

import Link from "next/link";
import Portrait from "@/components/Portrait";
import { COMPANIONS, type Companion } from "@/prompts/companions";

type Contact = { name: string; detail: string };

const telHref = (detail: string) =>
  /^[\d\s()+.-]+$/.test(detail) && detail.replace(/\D/g, "").length >= 3 ? `tel:${detail.replace(/[^\d+]/g, "")}` : null;

// Choose who you talk with: four AI companions, each with their own way of talking.
// Below, the people you trust stay one tap away.
export default function CompanionCard({ companion, onChange, contacts }: {
  companion: Companion;
  onChange: (c: Companion) => void;
  contacts: Contact[];
}) {
  const index = COMPANIONS.findIndex((c) => c.id === companion.id);
  const step = (by: number) => onChange(COMPANIONS[(index + by + COMPANIONS.length) % COMPANIONS.length]);
  const first = contacts[0];
  const call = first && telHref(first.detail);

  return (
    <section
      className="glass relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[2rem] p-5 sm:p-6"
      style={{ backgroundImage: `linear-gradient(160deg, ${companion.look.bg[0]}cc, ${companion.look.bg[1]}cc)` }}
    >
      <div className="relative z-10 max-w-[45%]">
        <h2 className="text-xl font-normal tracking-tight text-[#1d221e]">Your companion</h2>
        <p className="text-sm text-[#5f675f]">Choose who you talk with</p>
      </div>

      <Portrait key={companion.id} companion={companion} variant="card" />

      <div className="relative z-10 mt-auto rounded-3xl bg-[var(--card-solid)] p-3 text-[var(--fg)] shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => step(-1)}
            aria-label="Previous companion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <Link
            href="/chat"
            className="flex h-11 flex-1 items-center justify-between rounded-full bg-[#1d221e] pr-1 pl-5 text-sm text-white"
          >
            Talk with {companion.name}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
          </Link>
          <button
            onClick={() => step(1)}
            aria-label="Next companion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="mt-3 rounded-2xl bg-[var(--accent-soft)]/60 px-4 py-3">
          <p className="text-xl tracking-tight">{companion.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="12" r="10" />
            </svg>
            {companion.title} · AI companion
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{companion.about}</p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {COMPANIONS.map((c) => (
              <span key={c.id} className={"h-1.5 rounded-full transition-all " + (c.id === companion.id ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--check)]")} />
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 px-1 text-sm">
          <span className="text-[var(--muted)]">In a hard moment</span>
          {first ? (
            call ? (
              <a href={call} className="truncate text-[var(--accent)] hover:underline">
                Call {first.name || first.detail}
              </a>
            ) : (
              <Link href="/settings" className="truncate text-[var(--accent)] hover:underline">
                {first.name}: {first.detail}
              </Link>
            )
          ) : (
            <Link href="/settings" className="text-[var(--accent)] hover:underline">
              Add people you trust →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
