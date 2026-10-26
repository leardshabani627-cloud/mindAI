import { localDate } from "@/lib/dates";
import { thisWeek, type MoodEntry } from "@/components/home/week";

// This week's days, with a check on every day you checked in.
export default function WeekCard({ entries, loaded }: { entries: MoodEntry[]; loaded: boolean }) {
  const today = localDate();
  const done = new Set(entries.map((e) => e.entry_date));
  // "This week" depends on your clock, so the days are only filled in once the page runs in the browser.
  const days = loaded ? thisWeek() : [];
  const count = days.filter((d) => done.has(d.date)).length;

  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Check-ins</p>
          <h2 className="text-lg font-medium tracking-tight">This week</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {count}/7 days
        </span>
      </div>

      <ol className="mt-auto grid min-h-[4.25rem] grid-cols-7 gap-1 pt-4 text-center">
        {days.map((d) => {
          const isToday = d.date === today;
          const checked = done.has(d.date);
          return (
            <li key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-[var(--fg)]">{d.day}</span>
              {isToday ? (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--fg)] text-sm text-[var(--card-solid)]">
                  {checked ? "✓" : String(d.num).padStart(2, "0")}
                </span>
              ) : checked ? (
                <span
                  aria-label="Checked in"
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </span>
              ) : (
                <span className="grid h-9 w-9 place-items-center text-sm text-[var(--muted)]">
                  {String(d.num).padStart(2, "0")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
