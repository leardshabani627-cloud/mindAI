"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MoodChart from "@/components/MoodChart";
import MoodFactors from "@/components/MoodFactors";
import TopMenu from "@/components/TopMenu";
import { localDate } from "@/lib/dates";
import { serif } from "@/lib/fonts";
import { locale, useCopy, useLang } from "@/lib/i18n";

const en = {
  title: "Insights",
  subtitle: "How you've been lately, from your own check-ins.",
  backHome: "Back to home",
  average: "Average mood",
  averageHint: "last 30 days",
  checkins: "Check-ins",
  checkinsHint: "of the last 30 days",
  trend: "This week",
  trendUp: (n: string) => `${n} higher than last week`,
  trendDown: (n: string) => `${n} lower than last week`,
  trendSame: "About the same as last week",
  trendNone: "Not enough check-ins yet",
  streak: "Streak",
  streakHint: (n: number): string => (n === 1 ? "day in a row" : "days in a row"),
  chartTitle: "Your mood, last 30 days",
  chartHint: "Hover a point to see that day.",
  emptyTitle: "Nothing to show yet",
  emptyText: "Answer “How are you today?” on the home screen. After a few days, your mood shows here.",
  checkIn: "Check in now",
  reflectTitle: "A gentle look at your month",
  reflectText: "Your companion reads your check-ins and past conversations and points out patterns, in plain words. Never a diagnosis.",
  patterns: "What patterns do you see?",
  again: "Look again",
  thinking: "Reading your month…",
  needData: "Add a few check-ins first, then come back here.",
  failed: "Something went wrong. Please try again.",
  nothing: "Nothing to look at yet. Add a few check-ins first.",
};
const COPY = {
  en,
  sq: {
    title: "Pasqyra",
    subtitle: "Si ke qenë kohët e fundit, nga kontrollet e tua.",
    backHome: "Kthehu në ballinë",
    average: "Gjendja mesatare",
    averageHint: "30 ditët e fundit",
    checkins: "Kontrolle",
    checkinsHint: "nga 30 ditët e fundit",
    trend: "Këtë javë",
    trendUp: (n: string) => `${n} më lart se java e kaluar`,
    trendDown: (n: string) => `${n} më poshtë se java e kaluar`,
    trendSame: "Afërsisht si java e kaluar",
    trendNone: "Ende s'ka mjaft kontrolle",
    streak: "Radhazi",
    streakHint: (_n: number) => "ditë radhazi",
    chartTitle: "Gjendja jote, 30 ditët e fundit",
    chartHint: "Kalo mbi një pikë për ta parë atë ditë.",
    emptyTitle: "Ende s'ka çka të shfaqet",
    emptyText: "Përgjigju “Si je sot?” në ballinë. Pas disa ditësh, gjendja jote shfaqet këtu.",
    checkIn: "Regjistro gjendjen tani",
    reflectTitle: "Një vështrim i butë mbi muajin tënd",
    reflectText: "Shoqëruesi yt lexon kontrollet dhe bisedat e kaluara dhe të tregon modelet, me fjalë të thjeshta. Kurrë diagnozë.",
    patterns: "Çfarë modelesh sheh?",
    again: "Shiko përsëri",
    thinking: "Po e lexoj muajin tënd…",
    needData: "Shto disa kontrolle më parë, pastaj kthehu këtu.",
    failed: "Diçka shkoi keq. Provo përsëri.",
    nothing: "Ende s'ka çfarë të shihet. Shto disa kontrolle më parë.",
  } satisfies typeof en,
};

type Entry = { entry_date: string; mood: number; note: string; tags: string[] };

const card = "rounded-[1.5rem] border border-[var(--line)] bg-white/80 shadow-[0_20px_60px_-45px_rgba(20,50,30,0.5)]";
const face = (mood: number) => (mood >= 8 ? "😊" : mood >= 6 ? "🙂" : mood >= 4 ? "😐" : "😔");

/** Average mood over the given dates, or null if there are no check-ins among them. */
function averageOn(entries: Entry[], dates: Set<string>) {
  const list = entries.filter((e) => dates.has(e.entry_date));
  return list.length ? list.reduce((s, e) => s + e.mood, 0) / list.length : null;
}

/** The dates from `from` days ago up to `to` days ago (0 = today). */
function daysAgo(from: number, to: number) {
  const out = new Set<string>();
  for (let i = from; i >= to; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.add(localDate(d));
  }
  return out;
}

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
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(data.entries ?? []))
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

  // The four numbers at the top (worked out in the browser: "today" depends on your clock).
  const average = entries.length ? entries.reduce((s, e) => s + e.mood, 0) / entries.length : null;
  const thisWeek = loaded ? averageOn(entries, daysAgo(6, 0)) : null;
  const lastWeek = loaded ? averageOn(entries, daysAgo(13, 7)) : null;
  const trend = thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null;
  const dates = new Set(entries.map((e) => e.entry_date));
  let streak = 0;
  if (loaded) {
    const d = new Date();
    if (!dates.has(localDate(d))) d.setDate(d.getDate() - 1); // today not done yet: count up to yesterday
    while (dates.has(localDate(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  }
  const empty = loaded && entries.length === 0;

  const stats = [
    {
      label: t.average,
      value: average === null ? "–" : `${average.toFixed(1)}`,
      unit: average === null ? "" : "/10",
      icon: average === null ? "🌤️" : face(average),
      hint: t.averageHint,
    },
    { label: t.checkins, value: String(entries.length), unit: "", icon: "📅", hint: t.checkinsHint },
    {
      label: t.trend,
      value: trend === null ? "–" : `${trend > 0.25 ? "↑" : trend < -0.25 ? "↓" : "→"}`,
      unit: "",
      icon: "📈",
      hint:
        trend === null
          ? t.trendNone
          : trend > 0.25
            ? t.trendUp(trend.toFixed(1))
            : trend < -0.25
              ? t.trendDown(Math.abs(trend).toFixed(1))
              : t.trendSame,
    },
    { label: t.streak, value: String(streak), unit: "", icon: "🔥", hint: t.streakHint(streak) },
  ];

  return (
    <main className="flex min-h-dvh p-3 sm:p-6">
      <div className="glass animate-rise mx-auto w-full max-w-[1400px] rounded-[2.25rem] p-5 sm:p-7">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label={t.backHome}
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight sm:text-3xl">{t.title}</h1>
              <p className="text-sm text-[var(--muted)]">{t.subtitle}</p>
            </div>
          </div>
          <TopMenu current="/insights" />
        </header>

        {/* The numbers */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`${card} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{s.label}</p>
                <span className="text-lg" aria-hidden>
                  {s.icon}
                </span>
              </div>
              <p className="mt-1 text-3xl tracking-tight tabular-nums">
                {loaded ? s.value : " "}
                <span className="text-base text-[var(--muted)]">{loaded ? s.unit : ""}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{loaded ? s.hint : " "}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          {/* Chart */}
          <section className={`${card} flex flex-col p-5 sm:p-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg tracking-tight">{t.chartTitle}</h2>
              {!empty && <p className="text-xs text-[var(--muted)]">{t.chartHint}</p>}
            </div>
            <div className="relative mt-3 aspect-[800/260] w-full">
              {/* Dates depend on your clock and language, so the chart is drawn in the browser only */}
              {loaded && <MoodChart entries={entries} />}
              {empty && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="max-w-sm rounded-2xl bg-white/90 px-6 py-5 text-center shadow-sm">
                    <p className="text-[15px] font-medium">{t.emptyTitle}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{t.emptyText}</p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)]"
                    >
                      {t.checkIn} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* What affects your mood */}
          {loaded && <MoodFactors entries={entries} className={`${card} p-5 sm:p-6`} />}
        </div>

        {/* AI reflection */}
        <section className={`${card} mt-4 p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-xl" aria-hidden>
              ✨
            </span>
            <div className="min-w-0 flex-1 basis-64">
              <h2 className="text-lg tracking-tight">{t.reflectTitle}</h2>
              <p className="text-sm text-[var(--muted)]">{empty ? t.needData : t.reflectText}</p>
            </div>
            <button
              onClick={reflect}
              disabled={thinking || empty}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)] disabled:bg-[var(--accent-soft)] disabled:text-[var(--muted)]"
            >
              {thinking ? t.thinking : reflection ? t.again : t.patterns}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {reflection && (
            <p
              className={`${serif.className} mt-5 border-l-2 border-[var(--accent)] pl-5 text-lg leading-relaxed whitespace-pre-wrap text-[var(--fg)]/90`}
            >
              {reflection}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
