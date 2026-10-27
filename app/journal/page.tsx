"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TopMenu from "@/components/TopMenu";
import { JOURNAL_TAGS, tagInfo, type JournalTag } from "@/lib/journalTags";

type Entry = { id: string; title: string; body: string; tag: JournalTag; created_at: string; updated_at: string };
type Draft = { id: string | null; title: string; body: string; tag: JournalTag };

const EMPTY: Draft = { id: null, title: "", body: "", tag: "reflection" };
const DRAFT_KEY = "mind-journal-draft"; // an unsaved new entry survives closing the page (this device only)

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

// My journal: private writing. Entries are never sent to the AI.
export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY); // what the open entry looked like when loaded/saved
  const [promptIndex, setPromptIndex] = useState(0);
  const [filter, setFilter] = useState<JournalTag | "all">("all");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const dirty = draft.title !== saved.title || draft.body !== saved.body || draft.tag !== saved.tag;
  const tag = tagInfo(draft.tag);
  const prompt = tag.prompts.length ? tag.prompts[promptIndex % tag.prompts.length] : null;

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(data.entries))
      .finally(() => setLoaded(true));
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setDraft({ ...EMPTY, ...JSON.parse(stored), id: null });
    } catch {}
  }, []);

  // Keep an unsaved new entry on this device, in case the page is closed.
  useEffect(() => {
    if (draft.id) return;
    try {
      if (draft.title || draft.body) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [draft]);

  function confirmLeave() {
    return !dirty || !draft.id || confirm("You have unsaved changes to this entry. Leave without saving?");
  }

  function open(entry: Entry) {
    if (!confirmLeave()) return;
    const d = { id: entry.id, title: entry.title, body: entry.body, tag: entry.tag };
    setDraft(d);
    setSaved(d);
    setStatus("");
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startNew() {
    if (!confirmLeave()) return;
    setDraft(EMPTY);
    setSaved(EMPTY);
    setStatus("");
  }

  async function save() {
    if (!draft.title.trim() && !draft.body.trim()) return;
    setBusy(true);
    const res = await fetch(draft.id ? `/api/journal/${draft.id}` : "/api/journal", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.title, body: draft.body, tag: draft.tag }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setStatus("Couldn't save. Please try again.");

    const entry: Entry = await res.json();
    setEntries((prev) => (draft.id ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev]));
    const d = { id: entry.id, title: entry.title, body: entry.body, tag: entry.tag };
    setDraft(d);
    setSaved(d);
    setStatus("Saved.");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  async function remove() {
    if (!draft.id || !confirm("Delete this entry? This can't be undone.")) return;
    const res = await fetch(`/api/journal/${draft.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setStatus("Couldn't delete. Please try again.");
    setEntries((prev) => prev.filter((e) => e.id !== draft.id));
    setDraft(EMPTY);
    setSaved(EMPTY);
    setStatus("Deleted.");
  }

  const shown = filter === "all" ? entries : entries.filter((e) => e.tag === filter);
  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  return (
    <main className="flex min-h-dvh p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col rounded-[2.5rem] border-2 border-[var(--glass-border)] p-4 sm:p-6 2xl:p-8">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label="Back to home"
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight">My journal</h1>
              <p className="text-sm text-[var(--muted)]">Ditari im. Private writing, just for you. Never sent to the AI.</p>
            </div>
          </div>
          <TopMenu current="/journal" />
        </header>

        <div className="mt-6 grid flex-1 gap-5 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
          {/* Writing */}
          <section ref={editorRef} className="glass flex flex-col rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {JOURNAL_TAGS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setDraft({ ...draft, tag: t.id });
                    setPromptIndex(0);
                  }}
                  className="rounded-full px-3 py-1 text-sm transition"
                  style={draft.tag === t.id ? t.chip : { color: "var(--muted)" }}
                  aria-pressed={draft.tag === t.id}
                >
                  {t.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-[var(--muted)]">
                {draft.id ? "Editing a saved entry" : fmt(new Date().toISOString())}
              </span>
            </div>

            {prompt && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--accent-soft)]/70 px-4 py-3">
                <span>
                  <span className="block">{prompt.en}</span>
                  <span className="block text-sm text-[var(--muted)]">{prompt.sq}</span>
                </span>
                <span className="flex gap-2 text-sm">
                  <button onClick={() => setDraft({ ...draft, title: prompt.en })} className="text-[var(--accent)] hover:underline">
                    Use as title
                  </button>
                  <button onClick={() => setPromptIndex(promptIndex + 1)} className="text-[var(--muted)] hover:text-[var(--fg)]">
                    Another ↻
                  </button>
                </span>
              </div>
            )}

            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              maxLength={120}
              placeholder="Title (optional)"
              className="mt-4 w-full bg-transparent text-2xl tracking-tight outline-none placeholder:text-[var(--muted)]/70"
            />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              maxLength={10_000}
              placeholder="Write whatever comes. Nobody else will read this. / Shkruaj çka të vjen."
              className="mt-2 min-h-[18rem] w-full flex-1 resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-[var(--muted)]"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
              <button
                onClick={save}
                disabled={busy || (!draft.title.trim() && !draft.body.trim()) || (!!draft.id && !dirty)}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)] disabled:opacity-40"
              >
                {busy ? "Saving…" : draft.id ? "Save changes" : "Save entry"}
              </button>
              {draft.id && (
                <>
                  <button onClick={startNew} className="rounded-full border border-[var(--line)] px-4 py-2 text-base">
                    New entry
                  </button>
                  <button onClick={remove} className="text-sm text-[var(--muted)] hover:text-red-600">
                    Delete
                  </button>
                </>
              )}
              <span className="text-sm text-[var(--muted)]">{status}</span>
              <span className="ml-auto text-sm text-[var(--muted)] tabular-nums">{words} words</span>
            </div>
          </section>

          {/* Past entries */}
          <section className="glass flex flex-col rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl tracking-tight">Past entries</h2>
                <p className="text-sm text-[var(--muted)]">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[{ id: "all" as const, label: "All" }, ...JOURNAL_TAGS].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={
                    "rounded-full px-3 py-1 text-sm " +
                    (filter === t.id ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)] hover:bg-[var(--accent-soft)]")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loaded && shown.length === 0 && (
              <p className="mt-6 text-base text-[var(--muted)]">
                {entries.length === 0 ? "Your entries will appear here. Start with one honest sentence." : "No entries with this label yet."}
              </p>
            )}

            <ul className="mt-3 flex-1 space-y-2 overflow-y-auto lg:max-h-[calc(100dvh-16rem)]">
              {shown.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => open(e)}
                    className={
                      "w-full rounded-2xl px-4 py-3 text-left transition " +
                      (draft.id === e.id ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--accent-soft)]/60")
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs" style={tagInfo(e.tag).chip}>
                        {tagInfo(e.tag).label}
                      </span>
                      <span className="ml-auto text-xs text-[var(--muted)]">{fmt(e.created_at)}</span>
                    </span>
                    <span className="mt-1 block truncate text-base">{e.title || e.body.split("\n")[0]}</span>
                    {e.title && e.body && (
                      <span className="line-clamp-2 block text-sm text-[var(--muted)]">{e.body}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
