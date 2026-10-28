import { locale, type Lang } from "@/lib/lang";

/** Local calendar date as YYYY-MM-DD (not UTC), so "today" matches the user's day. */
export function localDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The Monday the weekly letter looks back on: this week on Sundays, otherwise the last full week. */
export function letterWeekStart(now = new Date()) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // this week's Monday
  if (now.getDay() !== 0) monday.setDate(monday.getDate() - 7); // not Sunday yet: last week
  return localDate(monday);
}

/** "Oct 20 – 26" (or "Sep 29 – Oct 5") for the week starting on that Monday. */
export function formatWeek(weekStart: string, lang: Lang = "en") {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const month = (d: Date) => d.toLocaleDateString(locale(lang), { month: "short" });
  return start.getMonth() === end.getMonth()
    ? `${month(start)} ${start.getDate()} – ${end.getDate()}`
    : `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}`;
}
