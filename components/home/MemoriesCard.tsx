import Link from "next/link";

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

const CHIPS = ["a", "b", "c"].map((k) => ({ background: `var(--chip-${k}-bg)`, color: `var(--chip-${k}-fg)` }));

const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0];

// The latest things Mind remembers, like a journal.
export default function MemoriesCard({ summaries, loaded }: { summaries: Summary[]; loaded: boolean }) {
  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Recent memories</h2>
          <p className="text-sm text-[var(--muted)]">What Mind remembers from your talks</p>
        </div>
        <Link
          href="/memory"
          aria-label="Open all memories"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </Link>
      </div>

      {loaded && summaries.length === 0 && (
        <p className="mt-5 text-base text-[var(--muted)]">
          Your memories will appear here after a conversation ends.
        </p>
      )}

      <ul className="mt-3">
        {summaries.slice(0, 3).map((s, i) => (
          <li key={s.id} className="border-b border-[var(--line)] last:border-0">
            <Link href="/memory" className="flex items-center gap-3 py-3 text-base">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 3h9l4 4v14H6zM9 12h7M9 16h5" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 truncate">{firstSentence(s.summary)}</span>
              {s.themes[0] && (
                <span className="hidden shrink-0 rounded-full px-3 py-0.5 text-xs sm:inline" style={CHIPS[i % 3]}>
                  {s.themes[0]}
                </span>
              )}
              <time className="w-24 shrink-0 text-right text-sm text-[var(--muted)]">
                {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
