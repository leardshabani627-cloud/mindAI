"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

export default function MemoryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries))
      .finally(() => setLoaded(true));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this memory and the conversation it came from? This can't be undone.")) return;
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (res.ok) setSummaries((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <span className="text-xl tracking-wide">Memory</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          Home
        </Link>
      </header>

      <p className="mb-6 text-[var(--muted)]">
        What Mind remembers about our past conversations. The five most recent are used in new chats. Delete
        anything you&apos;d rather it forgot.
      </p>

      {loaded && summaries.length === 0 && (
        <p className="text-[var(--muted)]">Nothing here yet. Memories appear after a conversation ends.</p>
      )}

      <ul className="space-y-4">
        {summaries.map((s) => (
          <li key={s.id} className="rounded-2xl glass px-4 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
              <time>{new Date(s.created_at).toLocaleString()}</time>
              <button onClick={() => remove(s.id)} className="hover:text-[var(--fg)]">
                Delete
              </button>
            </div>
            <p className="whitespace-pre-wrap">{s.summary}</p>
            {s.themes.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-2 text-sm">
                {s.themes.map((t) => (
                  <span key={t} className="rounded-full bg-[var(--accent)]/20 px-3 py-0.5">
                    {t}
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
