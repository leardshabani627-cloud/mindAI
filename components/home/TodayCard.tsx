"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { thisWeek, type MoodEntry } from "@/components/home/week";
import { localDate } from "@/lib/dates";
import { useCopy, useLang } from "@/lib/i18n";
import { MAX_MOOD_TAGS, MOOD_TAGS, moodTag } from "@/lib/moodTags";

const SKIP_KEY = "mind-mood-skipped";

// Five faces instead of a 1–10 slider: quicker on a hard day. Stored as 2, 4, 6, 8 or 10.
const FACES = [
  { mood: 2, icon: "😞", en: "Rough", sq: "Keq", color: "#e3a58b" },
  { mood: 4, icon: "😕", en: "Low", sq: "Jo mirë", color: "#ebc99c" },
  { mood: 6, icon: "😐", en: "Okay", sq: "Ashtu-ashtu", color: "#d6dcc0" },
  { mood: 8, icon: "🙂", en: "Good", sq: "Mirë", color: "#a7c79a" },
  { mood: 10, icon: "😄", en: "Great", sq: "Shumë mirë", color: "#6f9c63" },
];
/** The face closest to a saved mood (older check-ins used the whole 1–10 scale). */
const faceFor = (mood: number) => FACES[Math.min(4, Math.max(0, Math.round((mood - 2) / 2)))];

const en = {
  title: "Today",
  ask: "How are you feeling?",
  thanks: "Thanks for checking in.",
  skippedText: "Skipped for today.",
  checkIn: "Check in",
  edit: "Change",
  affecting: "What's affecting your day?",
  notePlaceholder: "One line, if you like…",
  notNow: "Not now",
  save: "Save",
  saving: "Saving…",
  failed: "Couldn't save. Please try again.",
  week: "This week",
  days: (n: number) => `${n}/7 days`,
  noCheckIns: "No check-ins this week yet.",
  lighter: "You've felt lighter this week. What helped?",
  mixed: "A mixed week, with some good moments.",
  heavy: "It's been a heavy week. Be gentle with yourself.",
  insights: "Insights →",
};
const COPY = {
  en,
  sq: {
    title: "Sot",
    ask: "Si po ndihesh?",
    thanks: "Faleminderit që e regjistrove.",
    skippedText: "E kalove për sot.",
    checkIn: "Regjistro",
    edit: "Ndrysho",
    affecting: "Çka po të ndikon sot?",
    notePlaceholder: "Një rresht, nëse dëshiron…",
    notNow: "Jo tani",
    save: "Ruaje",
    saving: "Po ruhet…",
    failed: "Nuk u ruajt. Provo përsëri.",
    week: "Këtë javë",
    days: (n: number) => `${n}/7 ditë`,
    noCheckIns: "Asnjë kontroll këtë javë ende.",
    lighter: "Këtë javë je ndier më lehtë. Çka të ndihmoi?",
    mixed: "Një javë e përzier, me disa momente të mira.",
    heavy: "Ka qenë një javë e rëndë. Bëhu i butë me veten.",
    insights: "Pasqyra →",
  } satisfies typeof en,
};

// Today's check-in (five faces, then what's affecting the day), and the week coloured by mood below.
export default function TodayCard({ entries, loaded, onSaved }: {
  entries: MoodEntry[];
  loaded: boolean;
  onSaved: (entry: MoodEntry) => void;
}) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [today, setToday] = useState(""); // from your clock, so set in the browser
  const [skipped, setSkipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const date = localDate();
    setToday(date);
    try {
      setSkipped(localStorage.getItem(SKIP_KEY) === date);
    } catch {}
  }, []);

  const todayEntry = entries.find((e) => e.entry_date === today);
  const checkingIn = loaded && !!today && (editing || (!todayEntry && !skipped));
  const days = today ? thisWeek(lang) : [];
  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const weekEntries = days.map((d) => byDate.get(d.date)).filter(Boolean) as MoodEntry[];
  const avg = weekEntries.length ? weekEntries.reduce((s, e) => s + e.mood, 0) / weekEntries.length : null;

  function startEdit() {
    setMood(todayEntry?.mood ?? null);
    setTags(todayEntry?.tags ?? []);
    setNote(todayEntry?.note ?? "");
    setSkipped(false);
    setEditing(true);
  }

  function toggleTag(id: string) {
    setTags((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_MOOD_TAGS ? [...list, id] : list));
  }

  function skip() {
    try {
      localStorage.setItem(SKIP_KEY, today);
    } catch {}
    setSkipped(true);
    setEditing(false);
  }

  async function save() {
    if (mood === null) return;
    setSaving(true);
    setError("");
    const entry = { entry_date: today, mood, note: note.trim(), tags };
    const res = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: entry.entry_date, mood: entry.mood, note: entry.note, tags }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return setError(t.failed);
    onSaved(entry);
    setEditing(false);
  }

  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl leading-tight tracking-tight">{t.title}</h2>
          <p className="text-sm text-[var(--muted)]">
            {checkingIn ? t.ask : todayEntry ? t.thanks : skipped ? t.skippedText : " "}
          </p>
        </div>
      </div>

      {/* When the cards are stretched to the same height, today's part sits in the middle. */}
      <div className="flex flex-1 flex-col justify-center">
      {checkingIn ? (
        <div className="mt-4">
          {/* Five faces */}
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t.ask}>
            {FACES.map((f) => (
              <button
                key={f.mood}
                role="radio"
                aria-checked={mood === f.mood}
                onClick={() => setMood(f.mood)}
                className={
                  "flex flex-col items-center gap-1 rounded-2xl border py-2.5 transition " +
                  (mood === f.mood ? "border-[var(--accent)] bg-white shadow-sm" : "border-transparent hover:bg-white/70")
                }
              >
                <span className={"text-3xl transition " + (mood !== null && mood !== f.mood ? "opacity-45 grayscale-[40%]" : "")} aria-hidden>
                  {f.icon}
                </span>
                <span className="text-xs text-[var(--muted)]">{f[lang]}</span>
              </button>
            ))}
          </div>

          {/* Then, what's affecting the day */}
          {mood !== null && (
            <div className="animate-rise mt-4">
              <p className="text-sm text-[var(--muted)]">{t.affecting}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MOOD_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={tags.includes(tag.id)}
                    className={
                      "flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition " +
                      (tags.includes(tag.id)
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border-[var(--line)] bg-white/60 hover:bg-white")
                    }
                  >
                    <span aria-hidden>{tag.icon}</span>
                    {tag[lang]}
                  </button>
                ))}
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder={t.notePlaceholder}
                className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-2.5 text-base outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button onClick={skip} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
              {t.notNow}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
            {mood !== null && (
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--on-accent)] hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                {saving ? t.saving : t.save}
              </button>
            )}
          </div>
        </div>
      ) : todayEntry ? (
        // Done for today
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white/70 px-4 py-3">
          <span className="text-4xl" aria-hidden>
            {faceFor(todayEntry.mood).icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg">{faceFor(todayEntry.mood)[lang]}</p>
            {!!todayEntry.tags?.length && (
              <p className="truncate text-sm text-[var(--muted)]">
                {todayEntry.tags
                  .map((id) => moodTag(id))
                  .filter(Boolean)
                  .map((tag) => `${tag!.icon} ${tag![lang]}`)
                  .join(" · ")}
              </p>
            )}
          </div>
          <button onClick={startEdit} className="rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm hover:bg-[var(--accent-soft)]">
            {t.edit}
          </button>
        </div>
      ) : skipped ? (
        <button
          onClick={startEdit}
          className="mt-4 w-fit rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)]"
        >
          {t.checkIn}
        </button>
      ) : null}
      </div>

      {/* The week, coloured by mood */}
      <div className="pt-5">
      <div className="border-t border-[var(--line)] pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-medium">{t.week}</p>
          <span className="flex items-center gap-3 text-sm">
            <span className="text-[var(--muted)]">{t.days(weekEntries.length)}</span>
            <Link href="/insights" className="text-[var(--accent-strong)] hover:underline">
              {t.insights}
            </Link>
          </span>
        </div>
        <ol className="mt-3 grid min-h-[3.75rem] grid-cols-7 gap-1 text-center">
          {days.map((d) => {
            const entry = byDate.get(d.date);
            const isToday = d.date === today;
            const face = entry ? faceFor(entry.mood) : null;
            return (
              <li key={d.date} className="flex flex-col items-center gap-1.5">
                <span className={"text-xs " + (isToday ? "font-medium text-[var(--fg)]" : "text-[var(--muted)]")}>{d.day}</span>
                <span
                  title={face ? `${face[lang]}` : undefined}
                  className={
                    "grid h-9 w-9 place-items-center rounded-full text-sm " +
                    (face ? "text-white shadow-sm" : "border border-dashed border-[var(--check)] text-[var(--muted)]") +
                    (isToday ? " ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-white/0" : "")
                  }
                  style={face ? { background: face.color } : undefined}
                >
                  {face ? <span aria-hidden className="text-base">{face.icon}</span> : d.num}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-[var(--muted)]">{avg === null ? t.noCheckIns : avg >= 7.5 ? t.lighter : avg >= 5 ? t.mixed : t.heavy}</p>
      </div>
      </div>
    </section>
  );
}
