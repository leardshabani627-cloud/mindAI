"use client";

import { useCopy, useLang } from "@/lib/i18n";
import { moodTag } from "@/lib/moodTags";

const en = {
  title: "What affects your mood",
  compared: (usual: string) => `compared with your usual ${usual}`,
  empty: "When you check in, tap what's affecting your day (sleep, work, family…). After a few days, patterns show up here.",
  days: "days",
  lower: (what: string, by: string) => `On days with ${what}, your mood has been ${by} lower than usual.`,
  higher: (what: string, by: string) => `On days with ${what}, your mood has been ${by} higher than usual.`,
  same: (what: string) => `Days with ${what} look about like your usual.`,
  note: "Based only on your own check-ins from the last 30 days. Patterns, not proof: more check-ins make them clearer.",
};
const COPY = {
  en,
  sq: {
    title: "Çka ndikon në gjendjen tënde",
    compared: (usual: string) => `krahasuar me mesataren tënde ${usual}`,
    empty: "Kur bën kontrollin, prek çka po të ndikon (gjumi, puna, familja…). Pas disa ditësh, modelet shfaqen këtu.",
    days: "ditë",
    lower: (what: string, by: string) => `Në ditët me ${what}, gjendja jote ka qenë ${by} më e ulët se zakonisht.`,
    higher: (what: string, by: string) => `Në ditët me ${what}, gjendja jote ka qenë ${by} më e lartë se zakonisht.`,
    same: (what: string) => `Ditët me ${what} duken si zakonisht.`,
    note: "Bazuar vetëm në kontrollet e tua të 30 ditëve të fundit. Modele, jo prova: më shumë kontrolle i bëjnë më të qarta.",
  } satisfies typeof en,
};

type Entry = { mood: number; tags?: string[] };

const MIN_DAYS = 2; // a factor needs at least this many check-ins before we say anything about it

// For each thing you tagged, compare your mood on those days with your usual mood.
// Simple averages over your own check-ins, shown gently: patterns, not proof.
export default function MoodFactors({ entries }: { entries: Entry[] }) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const usual = entries.reduce((s, e) => s + e.mood, 0) / (entries.length || 1);

  const factors = Object.entries(
    entries.reduce<Record<string, number[]>>((acc, e) => {
      for (const id of e.tags ?? []) (acc[id] ??= []).push(e.mood);
      return acc;
    }, {}),
  )
    .filter(([id, moods]) => moodTag(id) && moods.length >= MIN_DAYS)
    .map(([id, moods]) => ({ tag: moodTag(id)!, days: moods.length, diff: moods.reduce((s, m) => s + m, 0) / moods.length - usual }))
    .sort((a, b) => a.diff - b.diff);

  return (
    <section className="mt-6 rounded-2xl glass px-4 py-4">
      <h2 className="text-lg tracking-tight">{t.title}</h2>
      <p className="mb-3 text-sm text-[var(--muted)]">{t.compared(usual.toFixed(1))}</p>

      {factors.length === 0 ? (
        <p className="text-base text-[var(--muted)]">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {factors.map(({ tag, days, diff }) => {
            const width = Math.min(50, (Math.abs(diff) / 4) * 50); // ±4 points fills half the bar
            const lower = diff < -0.25;
            const higher = diff > 0.25;
            return (
              <li key={tag.id}>
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span>
                    <span aria-hidden>{tag.icon}</span> {tag[lang]}
                    <span className="text-sm text-[var(--muted)]"> · {days} {t.days}</span>
                  </span>
                  <span className={"text-sm tabular-nums " + (lower ? "text-[#b0704f]" : higher ? "text-[var(--accent)]" : "text-[var(--muted)]")}>
                    {higher ? "+" : ""}
                    {diff.toFixed(1)}
                  </span>
                </div>
                <div className="relative mt-1 h-2 rounded-full bg-[var(--accent-soft)]">
                  <span className="absolute top-0 left-1/2 h-2 w-px bg-[var(--muted)]/40" />
                  <span
                    className={"absolute top-0 h-2 rounded-full " + (diff < 0 ? "bg-[#d9a184]" : "bg-[var(--accent)]")}
                    style={diff < 0 ? { right: "50%", width: `${width}%` } : { left: "50%", width: `${width}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {lower
                    ? t.lower(tag[lang].toLowerCase(), Math.abs(diff).toFixed(1))
                    : higher
                      ? t.higher(tag[lang].toLowerCase(), diff.toFixed(1))
                      : t.same(tag[lang].toLowerCase())}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {factors.length > 0 && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          {t.note}
        </p>
      )}
    </section>
  );
}
