"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localDate } from "@/lib/dates";
import { thisWeek, type MoodEntry } from "@/components/home/week";

const SKIP_KEY = "mind-mood-skipped";

function weekLine(avg: number) {
  if (avg >= 7.5) return "You've felt lighter this week. What helped?";
  if (avg >= 5) return "A mixed week, with some good moments.";
  return "It's been a heavy week. Be gentle with yourself.";
}

// Today's check-in (until it's done or skipped), then a soft summary of the week.
export default function MoodCard({ entries, loaded, onSaved }: {
  entries: MoodEntry[];
  loaded: boolean;
  onSaved: (entry: MoodEntry) => void;
}) {
  const today = localDate();
  const [skipped, setSkipped] = useState(true);
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      setSkipped(localStorage.getItem(SKIP_KEY) === localDate());
    } catch {
      setSkipped(false);
    }
  }, []);

  const doneToday = entries.some((e) => e.entry_date === today);
  const showCheckIn = loaded && !doneToday && !skipped;

  const week = new Set(thisWeek().map((d) => d.date));
  const weekEntries = entries.filter((e) => week.has(e.entry_date));
  const avg = weekEntries.length ? weekEntries.reduce((s, e) => s + e.mood, 0) / weekEntries.length : null;
  const pct = avg === null ? null : Math.round(((avg - 1) / 9) * 100);
  const segment = pct === null ? -1 : Math.min(6, Math.round((pct / 100) * 6));

  async function save() {
    setSaving(true);
    const entry = { entry_date: today, mood, note: note.trim() };
    const res = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: entry.entry_date, mood: entry.mood, note: entry.note }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) onSaved(entry);
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
          <h2 className="text-xl font-normal tracking-tight">Mood Tracker</h2>
          <p className="text-sm text-[var(--muted)]">{showCheckIn ? "How are you today? / Si je sot?" : "Your week at a glance"}</p>
        </div>
        <Link
          href="/insights"
          aria-label="Open insights"
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
            <span className="text-sm text-[var(--muted)]">Low</span>
            <input
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              aria-label="Mood from 1 to 10"
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--muted)]">Good</span>
            <span className="w-6 text-right text-lg tabular-nums">{mood}</span>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="One line, if you like… / Një rresht…"
            className="mt-3 w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-base outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="mt-3 flex items-center justify-between text-base">
            <button onClick={skip} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
              Not now
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-5 py-1.5 text-sm text-[var(--on-accent)] disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-end">
          <p className="text-4xl font-normal tracking-tight 2xl:text-5xl">{pct === null ? "–" : `${pct}%`}</p>
          <p className="text-sm text-[var(--muted)]">
            {avg === null ? "No check-ins this week yet." : weekLine(avg)}
          </p>
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
            <span className="text-[var(--muted)]">Unpleasant</span>
            <span className="text-[var(--accent)]">Pleasant</span>
          </div>
        </div>
      )}
    </section>
  );
}
