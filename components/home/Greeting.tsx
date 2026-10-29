"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LetterPill from "@/components/home/LetterPill";
import LockIcon from "@/components/LockIcon";
import type { MoodEntry } from "@/components/home/week";
import { localDate } from "@/lib/dates";
import { locale, useCopy, useLang } from "@/lib/i18n";

const en = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Still up?",
  subtitle: "A calm, private space to talk.",
  streak: (n: number) => `${n}-day streak`,
  actions: [
    { href: "/calm", icon: "🌿", label: "Breathe · 2 min", accountOnly: false },
    { href: "/journal", icon: "📓", label: "Write in journal", accountOnly: true },
    { href: "/safety-plan", icon: "🛟", label: "My safety plan", accountOnly: true },
  ],
};
const COPY = {
  en,
  sq: {
    morning: "Mirëmëngjes",
    afternoon: "Mirëdita",
    evening: "Mirëmbrëma",
    night: "Ende zgjuar?",
    subtitle: "Një hapësirë e qetë dhe private për të folur.",
    streak: (n: number) => `${n} ditë radhazi`,
    actions: [
      { href: "/calm", icon: "🌿", label: "Merr frymë · 2 min", accountOnly: false },
      { href: "/journal", icon: "📓", label: "Shkruaj në ditar", accountOnly: true },
      { href: "/safety-plan", icon: "🛟", label: "Plani im i sigurisë", accountOnly: true },
    ],
  } satisfies typeof en,
};

/** Days in a row with a check-in, counting back from today (or yesterday, if today isn't done yet). */
function streakOf(entries: MoodEntry[]) {
  const dates = new Set(entries.map((e) => e.entry_date));
  const d = new Date();
  if (!dates.has(localDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dates.has(localDate(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// The top of the home screen: a personal hello, today's date, the streak and weekly letter, and quick ways in.
export default function Greeting({ name, entries, guest, companionId, companionName }: {
  name: string | null;
  entries: MoodEntry[];
  guest: boolean;
  companionId: string;
  companionName: string;
}) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  // The hour and date come from your clock, so they're filled in once the page runs in the browser.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const hour = now?.getHours() ?? 12;
  const hello = hour < 5 ? t.night : hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;
  const streak = now ? streakOf(entries) : 0; // "today" comes from your clock, so only in the browser

  return (
    <section className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <p className="text-sm text-[var(--muted)]">
          {now ? now.toLocaleDateString(locale(lang), { weekday: "long", day: "numeric", month: "long" }) : " "}
        </p>
        <h1 className="mt-1 text-[clamp(1.9rem,2.6vw,2.9rem)] leading-tight tracking-tight">
          {now ? hello : " "}
          {now && name ? <span className="text-[var(--accent-strong)]">, {name}</span> : null}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-base text-[var(--muted)]">{t.subtitle}</p>
          {streak > 0 && (
            <span className="rounded-full bg-[#f6ead9] px-3 py-1 text-sm text-[#8a5a2b]">🔥 {t.streak(streak)}</span>
          )}
        </div>
        {!guest && <LetterPill companionId={companionId} companionName={companionName} />}
      </div>

      <nav className="flex flex-wrap gap-2">
        {t.actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <span aria-hidden>{a.icon}</span>
            {a.label}
            {guest && a.accountOnly && <LockIcon size={12} className="text-[var(--muted)]" />}
          </Link>
        ))}
      </nav>
    </section>
  );
}
