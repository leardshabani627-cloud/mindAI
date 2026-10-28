"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localDate } from "@/lib/dates";
import { thisWeek, type MoodEntry } from "@/components/home/week";
import { useCopy, useLang } from "@/lib/i18n";
import { MAX_MOOD_TAGS, MOOD_TAGS, moodTag } from "@/lib/moodTags";

const SKIP_KEY = "mind-mood-skipped";

const en = {
  title: "Mood Tracker",
  howAreYou: "How are you today?",
  weekGlance: "Your week at a glance",
  openInsights: "Open insights",
  low: "Low",
  good: "Good",
  moodLabel: "Mood from 1 to 10",
  affecting: "What's affecting you today?",
  notePlaceholder: "One line, if you like…",
  notNow: "Not now",
  save: "Save",
  noCheckIns: "No check-ins this week yet.",
  lighter: "You've felt lighter this week. What helped?",
  mixed: "A mixed week, with some good moments.",
  heavy: "It's been a heavy week. Be gentle with yourself.",
  today: "Today:",
  unpleasant: "Unpleasant",
  pleasant: "Pleasant",
};
const COPY = {
  en,
  sq: {
    title: "Gjendja ime",
    howAreYou: "Si je sot?",
    weekGlance: "Java jote me një shikim",
    openInsights: "Hap pasqyrën",
    low: "Keq",
    good: "Mirë",
    moodLabel: "Gjendja nga 1 deri në 10",
    affecting: "Çka po të ndikon sot?",
    notePlaceholder: "Një rresht, nëse dëshiron…",
    notNow: "Jo tani",
    save: "Ruaje",
    noCheckIns: "Asnjë kontroll këtë javë ende.",
    lighter: "Këtë javë je ndier më lehtë. Çka të ndihmoi?",
    mixed: "Një javë e përzier, me disa momente të mira.",
    heavy: "Ka qenë një javë e rëndë. Bëhu i butë me veten.",
    today: "Sot:",
    unpleasant: "E pakëndshme",
    pleasant: "E këndshme",
  } satisfies typeof en,
};

// Today's check-in (until it's done or skipped), then a soft summary of the week.
export default function MoodCard({ entries, loaded, onSaved }: {
  entries: MoodEntry[];
  loaded: boolean;
  onSaved: (entry: MoodEntry) => void;
}) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const today = localDate();
  const weekLine = (avg: number) => (avg >= 7.5 ? t.lighter : avg >= 5 ? t.mixed : t.heavy);
  const [skipped, setSkipped] = useState(true);
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      setSkipped(localStorage.getItem(SKIP_KEY) === localDate());
    } catch {
      setSkipped(false);
    }
  }, []);

  const todayEntry = entries.find((e) => e.entry_date === today);
  const doneToday = !!todayEntry;
  const showCheckIn = loaded && !doneToday && !skipped;

  const week = new Set(thisWeek().map((d) => d.date));
  const weekEntries = entries.filter((e) => week.has(e.entry_date));
  const avg = weekEntries.length ? weekEntries.reduce((s, e) => s + e.mood, 0) / weekEntries.length : null;
  const pct = avg === null ? null : Math.round(((avg - 1) / 9) * 100);
  const segment = pct === null ? -1 : Math.min(6, Math.round((pct / 100) * 6));

  async function save() {
    setSaving(true);
    const entry = { entry_date: today, mood, note: note.trim(), tags };
    const res = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: entry.entry_date, mood: entry.mood, note: entry.note, tags }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) onSaved(entry);
  }

  function toggleTag(id: string) {
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length < MAX_MOOD_TAGS ? [...t, id] : t));
  }

  function skip() {
    try {
      localStorage.setItem(SKIP_KEY, today);
    } catch {}
    setSkipped(true);
  }

  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-normal tracking-tight">{t.title}</h2>
          <p className="text-sm text-[var(--muted)]">{showCheckIn ? t.howAreYou : t.weekGlance}</p>
        </div>
        <Link
          href="/insights"
          aria-label={t.openInsights}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01" />
          </svg>
        </Link>
      </div>

      {showCheckIn ? (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted)]">{t.low}</span>
            <input
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              aria-label={t.moodLabel}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--muted)]">{t.good}</span>
            <span className="w-6 text-right text-lg tabular-nums">{mood}</span>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">{t.affecting}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                aria-pressed={tags.includes(tag.id)}
                className={
                  "rounded-full border px-2.5 py-1 text-sm transition " +
                  (tags.includes(tag.id)
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                    : "border-[var(--line)] hover:bg-[var(--accent-soft)]")
                }
              >
                <span aria-hidden>{tag.icon}</span> {tag[lang]}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={t.notePlaceholder}
            className="mt-3 w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-base outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="mt-3 flex items-center justify-between text-base">
            <button onClick={skip} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
              {t.notNow}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-5 py-1.5 text-sm text-[var(--on-accent)] disabled:opacity-40"
            >
              {t.save}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-end">
          <p className="text-4xl font-normal tracking-tight 2xl:text-5xl">{pct === null ? "–" : `${pct}%`}</p>
          <p className="text-sm text-[var(--muted)]">
            {avg === null ? t.noCheckIns : weekLine(avg)}
          </p>
          {!!todayEntry?.tags?.length && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t.today}{" "}
              {todayEntry.tags
                .map((id) => moodTag(id))
                .filter(Boolean)
                .map((tag) => `${tag!.icon} ${tag![lang]}`)
                .join(" · ")}
            </p>
          )}
          <div className="mt-4 flex h-9 gap-px overflow-hidden rounded-xl">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className="flex-1 transition-colors"
                style={{
                  background:
                    i === segment
                      ? "var(--accent)"
                      : Math.abs(i - segment) === 1
                        ? "color-mix(in oklab, var(--accent) 35%, var(--accent-soft))"
                        : "var(--accent-soft)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-[var(--muted)]">{t.unpleasant}</span>
            <span className="text-[var(--accent)]">{t.pleasant}</span>
          </div>
        </div>
      )}
    </section>
  );
}
