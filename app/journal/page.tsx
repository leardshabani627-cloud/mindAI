"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TopMenu from "@/components/TopMenu";
import { serif } from "@/lib/fonts";
import { locale, useCopy, useLang, type Lang } from "@/lib/i18n";
import { JOURNAL_TAGS, tagInfo, tagLabel, type JournalTag } from "@/lib/journalTags";

const en = {
  title: "My journal",
  subtitle: "Private writing, just for you. Never sent to the AI.",
  backHome: "Back to home",
  newEntry: "New entry",
  search: "Search your entries",
  stats: { entries: "Entries", month: "This month", words: "Words" },
  all: "All",
  emptyTitle: "No entries yet",
  emptyText: "Your first entry will appear here. One honest sentence is a great start.",
  emptyTag: "No entries with this label yet.",
  noResults: "Nothing matches your search.",
  untitled: "Untitled",
  label: "Label",
  prompt: "Prompt",
  usePrompt: "Use prompt",
  another: "Another",
  titlePlaceholder: "Give it a title (optional)",
  bodyPlaceholder: "Write whatever comes. Nobody else will read this.",
  written: (date: string) => `Written ${date}`,
  edited: (date: string) => `edited ${date}`,
  privateNote: "Private, only you",
  unsaved: "Unsaved changes",
  draftKept: "Draft kept on this device",
  saved: "Saved",
  saving: "Saving…",
  saveEntry: "Save entry",
  saveChanges: "Save changes",
  delete: "Delete entry",
  words: (n: number) => `${n} ${n === 1 ? "word" : "words"}`,
  minutes: (n: number) => `${n} min read`,
  leave: "You have unsaved changes to this entry. Leave without saving?",
  confirmDelete: "Delete this entry? This can't be undone.",
  saveFailed: "Couldn't save. Please try again.",
  deleteFailed: "Couldn't delete. Please try again.",
  shortcut: "Ctrl + S",
};
const COPY = {
  en,
  sq: {
    title: "Ditari im",
    subtitle: "Shkrim privat, vetëm për ty. Nuk i dërgohet kurrë AI-së.",
    backHome: "Kthehu në ballinë",
    newEntry: "Shënim i ri",
    search: "Kërko në shënimet e tua",
    stats: { entries: "Shënime", month: "Këtë muaj", words: "Fjalë" },
    all: "Të gjitha",
    emptyTitle: "Ende asnjë shënim",
    emptyText: "Shënimi yt i parë do të shfaqet këtu. Një fjali e sinqertë është fillim i mirë.",
    emptyTag: "Ende asnjë shënim me këtë etiketë.",
    noResults: "Asgjë nuk përputhet me kërkimin.",
    untitled: "Pa titull",
    label: "Etiketa",
    prompt: "Pyetje",
    usePrompt: "Përdore",
    another: "Tjetër",
    titlePlaceholder: "Jepi një titull (opsional)",
    bodyPlaceholder: "Shkruaj çka të vjen. Askush tjetër s'do ta lexojë.",
    written: (date: string) => `Shkruar më ${date}`,
    edited: (date: string) => `ndryshuar më ${date}`,
    privateNote: "Privat, vetëm ti",
    unsaved: "Ndryshime të paruajtura",
    draftKept: "Drafti ruhet në këtë pajisje",
    saved: "U ruajt",
    saving: "Po ruhet…",
    saveEntry: "Ruaje shënimin",
    saveChanges: "Ruaj ndryshimet",
    delete: "Fshije shënimin",
    words: (n: number) => `${n} fjalë`,
    minutes: (n: number) => `${n} min lexim`,
    leave: "Ke ndryshime të paruajtura në këtë shënim. Të largohesh pa i ruajtur?",
    confirmDelete: "Ta fshijmë këtë shënim? Kjo nuk kthehet më.",
    saveFailed: "Nuk u ruajt. Provo përsëri.",
    deleteFailed: "Nuk u fshi. Provo përsëri.",
    shortcut: "Ctrl + S",
  } satisfies typeof en,
};

type Entry = { id: string; title: string; body: string; tag: JournalTag; created_at: string; updated_at: string };
type Draft = { id: string | null; title: string; body: string; tag: JournalTag };

const EMPTY: Draft = { id: null, title: "", body: "", tag: "reflection" };
const DRAFT_KEY = "mind-journal-draft"; // an unsaved new entry survives closing the page (this device only)

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const longDate = (d: Date, lang: Lang) => d.toLocaleDateString(locale(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric" });
const monthKey = (iso: string) => iso.slice(0, 7);

// My journal: private writing. Entries are never sent to the AI.
export default function JournalPage() {
  const w = useCopy(COPY);
  const { lang } = useLang();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY); // what the open entry looked like when loaded/saved
  const [promptIndex, setPromptIndex] = useState(0);
  const [filter, setFilter] = useState<JournalTag | "all">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | "saved" | "error">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState<Date | null>(null); // set in the browser only (dates depend on your clock)
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const dirty = draft.title !== saved.title || draft.body !== saved.body || draft.tag !== saved.tag;
  const tag = tagInfo(draft.tag);
  const prompt = tag.prompts.length ? tag.prompts[promptIndex % tag.prompts.length] : null;
  const openEntry = draft.id ? entries.find((e) => e.id === draft.id) : undefined;
  const words = countWords(draft.body);
  const canSave = !busy && (!!draft.title.trim() || !!draft.body.trim()) && (!draft.id || dirty);

  useEffect(() => {
    setNow(new Date());
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

  // Ctrl/Cmd + S saves, like any editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canSave) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function confirmLeave() {
    return !dirty || !draft.id || confirm(w.leave);
  }

  function open(entry: Entry) {
    if (!confirmLeave()) return;
    const d = { id: entry.id, title: entry.title, body: entry.body, tag: entry.tag };
    setDraft(d);
    setSaved(d);
    setStatus("");
    setError("");
  }

  function startNew() {
    if (!confirmLeave()) return;
    setDraft(EMPTY);
    setSaved(EMPTY);
    setStatus("");
    setError("");
    setPromptIndex(0);
    setTimeout(() => bodyRef.current?.focus(), 0);
  }

  async function save() {
    if (!draft.title.trim() && !draft.body.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch(draft.id ? `/api/journal/${draft.id}` : "/api/journal", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.title, body: draft.body, tag: draft.tag }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setStatus("error");
      return setError(w.saveFailed);
    }

    const entry: Entry = await res.json();
    setEntries((prev) => (draft.id ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev]));
    const d = { id: entry.id, title: entry.title, body: entry.body, tag: entry.tag };
    setDraft(d);
    setSaved(d);
    setStatus("saved");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  async function remove() {
    if (!draft.id || !confirm(w.confirmDelete)) return;
    const res = await fetch(`/api/journal/${draft.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setStatus("error");
      return setError(w.deleteFailed);
    }
    setEntries((prev) => prev.filter((e) => e.id !== draft.id));
    setDraft(EMPTY);
    setSaved(EMPTY);
    setStatus("");
  }

  // The list: label filter and search, grouped by month (newest first).
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) => (filter === "all" || e.tag === filter) && (!q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)),
    );
  }, [entries, filter, query]);
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of shown) map.set(monthKey(e.created_at), [...(map.get(monthKey(e.created_at)) ?? []), e]);
    return [...map.entries()];
  }, [shown]);

  const thisMonth = now ? entries.filter((e) => monthKey(e.created_at) === monthKey(now.toISOString())).length : 0;
  const totalWords = entries.reduce((sum, e) => sum + countWords(e.body), 0);

  const statusText = error
    ? error
    : draft.id
      ? dirty
        ? w.unsaved
        : status === "saved"
          ? `✓ ${w.saved}`
          : ""
      : draft.title || draft.body
        ? w.draftKept
        : "";

  return (
    <main className="flex min-h-dvh p-3 sm:p-6">
      <div className="glass animate-rise mx-auto flex w-full max-w-[1400px] flex-col rounded-[2.25rem] p-5 sm:p-7 lg:h-[calc(100dvh-3rem)]">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label={w.backHome}
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight sm:text-3xl">{w.title}</h1>
              <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <LockGlyph />
                {w.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNew}
              className="hidden h-10 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-sm text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)] sm:flex"
            >
              <span className="text-lg leading-none">+</span>
              {w.newEntry}
            </button>
            <TopMenu current="/journal" />
          </div>
        </header>

        <div className="mt-6 grid min-h-0 flex-1 gap-5 lg:grid-cols-[22rem_1fr] lg:gap-6">
          {/* Writing page (first on phones) */}
          <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white/80 shadow-[0_20px_60px_-40px_rgba(20,50,30,0.5)] lg:order-2 lg:min-h-0">
            {/* Date and label */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-8">
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{now ? longDate(openEntry ? new Date(openEntry.created_at) : now, lang) : " "}</p>
                <p className="text-xs text-[var(--muted)]">
                  {openEntry
                    ? openEntry.updated_at.slice(0, 16) !== openEntry.created_at.slice(0, 16)
                      ? `${w.written(shortDate(openEntry.created_at, lang))} · ${w.edited(shortDate(openEntry.updated_at, lang))}`
                      : w.written(shortDate(openEntry.created_at, lang))
                    : w.privateNote}
                </p>
              </div>
              <div role="radiogroup" aria-label={w.label} className="flex flex-wrap gap-1 rounded-full bg-[var(--bg)] p-1">
                {JOURNAL_TAGS.map((t) => (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={draft.tag === t.id}
                    onClick={() => {
                      setDraft({ ...draft, tag: t.id });
                      setPromptIndex(0);
                    }}
                    className={
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition " +
                      (draft.tag === t.id ? "bg-white text-[var(--fg)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--fg)]")
                    }
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: t.chip.color }} />
                    {tagLabel(t, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* The page */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="mx-auto flex h-full max-w-[44rem] flex-col">
                {prompt && !draft.id && (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)]/50 px-4 py-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[var(--accent-strong)]" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium tracking-wide text-[var(--accent-strong)] uppercase">{w.prompt}</p>
                      <p className="text-[15px]">{prompt[lang]}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setDraft({ ...draft, title: prompt[lang] })}
                        className="rounded-full bg-white px-3 py-1 text-sm text-[var(--accent-strong)] shadow-sm hover:bg-[var(--accent-soft)]"
                      >
                        {w.usePrompt}
                      </button>
                      <button
                        onClick={() => setPromptIndex(promptIndex + 1)}
                        aria-label={w.another}
                        title={w.another}
                        className="grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-white hover:text-[var(--fg)]"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  maxLength={120}
                  placeholder={w.titlePlaceholder}
                  className={`${serif.className} w-full bg-transparent text-3xl tracking-tight outline-none placeholder:text-[var(--muted)]/60`}
                />
                <textarea
                  ref={bodyRef}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  maxLength={10_000}
                  placeholder={w.bodyPlaceholder}
                  className="mt-4 min-h-[16rem] w-full flex-1 resize-none bg-transparent text-[17px] leading-8 outline-none placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] bg-white/60 px-5 py-3 sm:px-8">
              <span className={"flex items-center gap-1.5 text-sm " + (error ? "text-red-600" : "text-[var(--muted)]")}>
                {!error && <LockGlyph />}
                {statusText || w.privateNote}
              </span>
              <span className="text-sm text-[var(--muted)] tabular-nums">
                {w.words(words)}
                {words > 0 && ` · ${w.minutes(Math.max(1, Math.round(words / 200)))}`}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {draft.id && (
                  <button
                    onClick={remove}
                    aria-label={w.delete}
                    title={w.delete}
                    className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={!canSave}
                  title={w.shortcut}
                  className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)] disabled:bg-[var(--accent-soft)] disabled:text-[var(--muted)]"
                >
                  {busy ? w.saving : draft.id ? w.saveChanges : w.saveEntry}
                </button>
              </div>
            </div>
          </section>

          {/* Entries */}
          <aside className="flex min-h-0 flex-col lg:order-1">
            <button
              onClick={startNew}
              className="mb-3 flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)] sm:hidden"
            >
              <span className="text-lg leading-none">+</span>
              {w.newEntry}
            </button>

            <label className="relative block">
              <span className="sr-only">{w.search}</span>
              <svg
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={w.search}
                className="w-full rounded-2xl border border-[var(--line)] bg-white/80 py-2.5 pr-3 pl-10 text-[15px] outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>

            {/* Small numbers */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                [w.stats.entries, entries.length],
                [w.stats.month, thisMonth],
                [w.stats.words, totalWords],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2">
                  <p className="text-lg leading-tight tabular-nums">{(value as number).toLocaleString(locale(lang))}</p>
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                </div>
              ))}
            </div>

            {/* Label filter */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[{ id: "all" as const, label: w.all, color: "" }, ...JOURNAL_TAGS.map((t) => ({ id: t.id, label: tagLabel(t, lang), color: t.chip.color }))].map(
                (t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    aria-pressed={filter === t.id}
                    className={
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition " +
                      (filter === t.id
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border-[var(--line)] bg-white/60 text-[var(--fg)]/75 hover:bg-white")
                    }
                  >
                    {t.color && <span className="h-2 w-2 rounded-full" style={{ background: filter === t.id ? "currentColor" : t.color }} />}
                    {t.label}
                  </button>
                ),
              )}
            </div>

            {/* The list */}
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {!loaded ? (
                <div className="space-y-2" aria-busy>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white/50" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--check)] px-6 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]" aria-hidden>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
                      <path d="M4 19a2 2 0 0 1 2-2h12M9 7h5" />
                    </svg>
                  </span>
                  <p className="mt-3 text-[15px] font-medium">{w.emptyTitle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{w.emptyText}</p>
                </div>
              ) : shown.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-[var(--muted)]">{query ? w.noResults : w.emptyTag}</p>
              ) : (
                groups.map(([month, list]) => (
                  <div key={month} className="mb-4">
                    <p className="mb-1.5 px-1 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                      {new Date(`${month}-01T12:00:00`).toLocaleDateString(locale(lang), { month: "long", year: "numeric" })}
                    </p>
                    <ul className="space-y-1.5">
                      {list.map((e) => {
                        const d = new Date(e.created_at);
                        const info = tagInfo(e.tag);
                        const active = draft.id === e.id;
                        return (
                          <li key={e.id}>
                            <button
                              onClick={() => open(e)}
                              aria-current={active || undefined}
                              className={
                                "flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition " +
                                (active ? "border-[var(--accent)]/40 bg-white shadow-sm" : "border-transparent hover:border-[var(--line)] hover:bg-white/70")
                              }
                            >
                              <span className="flex w-10 shrink-0 flex-col items-center rounded-xl bg-[var(--accent-soft)]/70 py-1">
                                <span className="text-xs text-[var(--muted)] uppercase">
                                  {d.toLocaleDateString(locale(lang), { weekday: "short" })}
                                </span>
                                <span className="text-lg leading-tight tabular-nums">{d.getDate()}</span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-medium">{e.title || e.body.split("\n")[0] || w.untitled}</span>
                                <span className="block truncate text-sm text-[var(--muted)]">{e.title ? e.body.replace(/\s+/g, " ") : " "}</span>
                                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: info.chip.color }} />
                                  {tagLabel(info, lang)} · {w.words(countWords(e.body))}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function LockGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
