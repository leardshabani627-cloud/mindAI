import { localDate } from "@/lib/dates";

export type MoodEntry = { entry_date: string; mood: number; note: string };

/** Monday to Sunday of the current week, as local dates. */
export function thisWeek() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: localDate(d), day: d.toLocaleDateString("en-US", { weekday: "short" }), num: d.getDate() };
  });
}
