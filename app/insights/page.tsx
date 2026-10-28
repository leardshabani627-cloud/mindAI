"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MoodChart from "@/components/MoodChart";
import MoodFactors from "@/components/MoodFactors";
import { useCopy, useLang } from "@/lib/i18n";

const en = {
  title: "Insights",
  home: "Home",
  chartTitle: "Mood, last 30 days",
  summary: (n: number, avg: string) => `${n} check-ins, average ${avg}`,
  none: "No check-ins yet. Answer \u201CHow are you today?\u201D on the home screen.",
  thinking: "Thinking…",
  patterns: "What patterns do you see?",
  failed: "Something went wrong. Please try again.",
  nothing: "Nothing to look at yet. Add a few check-ins first.",
};
const COPY = {
  en,
  sq: {
    title: "Pasqyra",
    home: "Ballina",
    chartTitle: "Gjendja, 30 ditët e fundit",
    summary: (n: number, avg: string) => `${n} kontrolle, mesatarja ${avg}`,
    none: "Ende asnjë kontroll. Përgjigju \u201CSi je sot?\u201D në ballinë.",
    thinking: "Po mendoj…",
    patterns: "Çfarë modelesh sheh?",
    failed: "Diçka shkoi keq. Provo përsëri.",
    nothing: "Ende s'ka çfarë të shihet. Shto disa kontrolle më parë.",
  } satisfies typeof en,
};

type Entry = { entry_date: string; mood: number; note: string; tags: string[] };

export default function InsightsPage() {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mood")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries))
      .finally(() => setLoaded(true));
  }, []);

  async function reflect() {
    setThinking(true);
    setError("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) throw new Error(res.status === 400 ? t.nothing : t.failed);
      setReflection((await res.json()).reflection);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.failed);
    } finally {
      setThinking(false);
    }
  }

  const average = entries.length ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <span className="text-xl tracking-wide">{t.title}</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          {t.home}
        </Link>
      </header>

      <section className="rounded-2xl glass px-4 py-4">
        <p className="mb-2 text-[var(--muted)]">{t.chartTitle}</p>
        {/* Dates depend on your clock and language, so the chart is drawn in the browser only */}
        {loaded ? <MoodChart entries={entries} /> : <div className="aspect-[600/220] w-full" />}
        {loaded && (
          <p className="mt-2 text-base text-[var(--muted)]">
            {average ? t.summary(entries.length, average) : t.none}
          </p>
        )}
      </section>

      {loaded && entries.length > 0 && <MoodFactors entries={entries} />}

      <button
        onClick={reflect}
        disabled={thinking}
        className="mt-6 rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)] disabled:opacity-40"
      >
        {thinking ? t.thinking : t.patterns}
      </button>

      {error && <p className="mt-4 text-[var(--muted)]">{error}</p>}
      {reflection && <p className="mt-4 whitespace-pre-wrap rounded-2xl glass px-4 py-4">{reflection}</p>}
    </main>
  );
}
