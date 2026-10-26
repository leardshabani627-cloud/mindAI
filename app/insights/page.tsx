"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MoodChart from "@/components/MoodChart";

type Entry = { entry_date: string; mood: number; note: string };

export default function InsightsPage() {
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
      const res = await fetch("/api/insights", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setReflection((await res.json()).reflection);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  const average = entries.length ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <span className="text-xl tracking-wide">Insights</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          Home
        </Link>
      </header>

      <section className="rounded-2xl glass px-4 py-4">
        <p className="mb-2 text-[var(--muted)]">Mood, last 30 days</p>
        {/* Dates depend on your clock and language, so the chart is drawn in the browser only */}
        {loaded ? <MoodChart entries={entries} /> : <div className="aspect-[600/220] w-full" />}
        {loaded && (
          <p className="mt-2 text-base text-[var(--muted)]">
            {average ? `${entries.length} check-ins, average ${average}` : "No check-ins yet. Answer “How are you today?” in the chat."}
          </p>
        )}
      </section>

      <button
        onClick={reflect}
        disabled={thinking}
        className="mt-6 rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)] disabled:opacity-40"
      >
        {thinking ? "Thinking…" : "What patterns do you see?"}
      </button>

      {error && <p className="mt-4 text-[var(--muted)]">{error}</p>}
      {reflection && <p className="mt-4 whitespace-pre-wrap rounded-2xl glass px-4 py-4">{reflection}</p>}
    </main>
  );
}
