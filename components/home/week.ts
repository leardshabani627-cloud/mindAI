import { localDate } from "@/lib/dates";
import { locale, type Lang } from "@/lib/lang";

export type MoodEntry = { entry_date: string; mood: number; note: string; tags: string[] };

/** Monday to Sunday of the current week, as local dates. */
export function thisWeek(lang: Lang = "en") {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: localDate(d), day: d.toLocaleDateString(locale(lang), { weekday: "short" }), num: d.getDate() };
  });
}
