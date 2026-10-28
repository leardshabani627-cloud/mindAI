"use client";

import Link from "next/link";
import { locale, useCopy, useLang } from "@/lib/i18n";

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

const CHIPS = ["a", "b", "c"].map((k) => ({ background: `var(--chip-${k}-bg)`, color: `var(--chip-${k}-fg)` }));

const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0];

const en = {
  title: "Recent memories",
  subtitle: "What Mind remembers from your talks",
  emptySubtitle: "Nothing saved yet. Here's how memories are made",
  openAll: "Open all memories",
  step: "Step",
  // Shown before there are any memories: how they come to be, in the same row style as real ones.
  howItWorks: [
    { title: "Talk to Mind about your day", chip: "Talk" },
    { title: "End the conversation, or just leave it for 20 minutes", chip: "Pause" },
    { title: "Mind keeps a short note: what you felt and what helped", chip: "Remember" },
  ],
  openConversation: "You have a conversation open. Save it as a memory now?",
  saving: "Saving…",
  save: "Save this conversation",
};
const COPY = {
  en,
  sq: {
    title: "Kujtimet e fundit",
    subtitle: "Çka mban mend Mind nga bisedat tuaja",
    emptySubtitle: "Asgjë e ruajtur ende. Ja si krijohen kujtimet",
    openAll: "Hap të gjitha kujtimet",
    step: "Hapi",
    howItWorks: [
      { title: "Fol me Mind për ditën tënde", chip: "Fol" },
      { title: "Mbylle bisedën, ose thjesht lëre për 20 minuta", chip: "Pushim" },
      { title: "Mind mban një shënim të shkurtër: çka ndjeve dhe çka të ndihmoi", chip: "Kujto" },
    ],
    openConversation: "Ke një bisedë të hapur. Ta ruajmë si kujtim tani?",
    saving: "Po ruhet…",
    save: "Ruaje këtë bisedë",
  } satisfies typeof en,
};

function Row({ title, chip, chipStyle, right }: { title: string; chip?: string; chipStyle: React.CSSProperties; right: React.ReactNode }) {
  return (
    <span className="flex items-center gap-3 py-3 text-base">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 3h9l4 4v14H6zM9 12h7M9 16h5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {chip && (
        <span className="hidden shrink-0 rounded-full px-3 py-0.5 text-xs sm:inline" style={chipStyle}>
          {chip}
        </span>
      )}
      {right}
    </span>
  );
}

// The latest things Mind remembers, like a journal.
export default function MemoriesCard({ summaries, loaded, hasConversation, saving, status, onSaveNow }: {
  summaries: Summary[];
  loaded: boolean;
  hasConversation: boolean;
  saving: boolean;
  status: string;
  onSaveNow: () => void;
}) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const empty = loaded && summaries.length === 0;

  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-normal tracking-tight">{t.title}</h2>
          <p className="text-sm text-[var(--muted)]">
            {empty ? t.emptySubtitle : t.subtitle}
          </p>
        </div>
        <Link
          href="/memory"
          aria-label={t.openAll}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </Link>
      </div>

      <ul className="mt-3">
        {empty
          ? t.howItWorks.map((step, i) => (
              <li key={step.chip} className="border-b border-[var(--line)] text-[var(--muted)] last:border-0">
                <Row
                  title={step.title}
                  chip={step.chip}
                  chipStyle={CHIPS[i]}
                  right={<span className="w-24 shrink-0 text-right text-sm">{t.step} {i + 1}</span>}
                />
              </li>
            ))
          : summaries.slice(0, 3).map((s, i) => (
              <li key={s.id} className="border-b border-[var(--line)] last:border-0">
                <Link href="/memory">
                  <Row
                    title={firstSentence(s.summary)}
                    chip={s.themes[0]}
                    chipStyle={CHIPS[i % 3]}
                    right={
                      <>
                        <time className="w-24 shrink-0 text-right text-sm text-[var(--muted)]">
                          {new Date(s.created_at).toLocaleDateString(locale(lang), { month: "short", day: "numeric", year: "numeric" })}
                        </time>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0 text-[var(--muted)]">
                          <circle cx="12" cy="5" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="12" cy="19" r="1.6" />
                        </svg>
                      </>
                    }
                  />
                </Link>
              </li>
            ))}
      </ul>

      {(hasConversation || status) && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <span className="text-sm text-[var(--muted)]">
            {status || t.openConversation}
          </span>
          {hasConversation && (
            <button
              onClick={onSaveNow}
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--on-accent)] disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
