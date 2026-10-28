"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { locale, useCopy, useLang } from "@/lib/i18n";

const en = {
  title: "Memory",
  home: "Home",
  intro: "What Mind remembers about our past conversations. The five most recent are used in new chats. Delete anything you'd rather it forgot.",
  empty: "Nothing here yet. Memories appear after a conversation ends.",
  delete: "Delete",
  confirmDelete: "Delete this memory and the conversation it came from? This can't be undone.",
};
const COPY = {
  en,
  sq: {
    title: "Kujtesa",
    home: "Ballina",
    intro: "Çka mban mend Mind nga bisedat tona të mëparshme. Pesë më të fundit përdoren në biseda të reja. Fshi çdo gjë që do të preferoje ta harrojë.",
    empty: "Ende asgjë këtu. Kujtimet shfaqen pasi mbyllet një bisedë.",
    delete: "Fshije",
    confirmDelete: "Ta fshijmë këtë kujtim dhe bisedën nga e cila erdhi? Kjo nuk kthehet më.",
  } satisfies typeof en,
};

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

export default function MemoryPage() {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries))
      .finally(() => setLoaded(true));
  }, []);

  async function remove(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (res.ok) setSummaries((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <span className="text-xl tracking-wide">{t.title}</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          {t.home}
        </Link>
      </header>

      <p className="mb-6 text-[var(--muted)]">
        {t.intro}
      </p>

      {loaded && summaries.length === 0 && (
        <p className="text-[var(--muted)]">{t.empty}</p>
      )}

      <ul className="space-y-4">
        {summaries.map((s) => (
          <li key={s.id} className="rounded-2xl glass px-4 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
              <time>{new Date(s.created_at).toLocaleString(locale(lang))}</time>
              <button onClick={() => remove(s.id)} className="hover:text-[var(--fg)]">
                {t.delete}
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
