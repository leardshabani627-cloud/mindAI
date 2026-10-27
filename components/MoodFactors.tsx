import { moodTag } from "@/lib/moodTags";

type Entry = { mood: number; tags?: string[] };

const MIN_DAYS = 2; // a factor needs at least this many check-ins before we say anything about it

// For each thing you tagged, compare your mood on those days with your usual mood.
// Simple averages over your own check-ins, shown gently: patterns, not proof.
export default function MoodFactors({ entries }: { entries: Entry[] }) {
  const usual = entries.reduce((s, e) => s + e.mood, 0) / (entries.length || 1);

  const factors = Object.entries(
    entries.reduce<Record<string, number[]>>((acc, e) => {
      for (const id of e.tags ?? []) (acc[id] ??= []).push(e.mood);
      return acc;
    }, {}),
  )
    .filter(([id, moods]) => moodTag(id) && moods.length >= MIN_DAYS)
    .map(([id, moods]) => ({ tag: moodTag(id)!, days: moods.length, diff: moods.reduce((s, m) => s + m, 0) / moods.length - usual }))
    .sort((a, b) => a.diff - b.diff);

  return (
    <section className="mt-6 rounded-2xl glass px-4 py-4">
      <h2 className="text-lg tracking-tight">What affects your mood</h2>
      <p className="mb-3 text-sm text-[var(--muted)]">Çka ndikon në gjendjen tënde · compared with your usual {usual.toFixed(1)}</p>

      {factors.length === 0 ? (
        <p className="text-base text-[var(--muted)]">
          When you check in, tap what&apos;s affecting your day (sleep, work, family…). After a few days, patterns show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {factors.map(({ tag, days, diff }) => {
            const width = Math.min(50, (Math.abs(diff) / 4) * 50); // ±4 points fills half the bar
            const lower = diff < -0.25;
            const higher = diff > 0.25;
            return (
              <li key={tag.id}>
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span>
                    <span aria-hidden>{tag.icon}</span> {tag.en}
                    <span className="text-sm text-[var(--muted)]"> · {days} days</span>
                  </span>
                  <span className={"text-sm tabular-nums " + (lower ? "text-[#b0704f]" : higher ? "text-[var(--accent)]" : "text-[var(--muted)]")}>
                    {higher ? "+" : ""}
                    {diff.toFixed(1)}
                  </span>
                </div>
                <div className="relative mt-1 h-2 rounded-full bg-[var(--accent-soft)]">
                  <span className="absolute top-0 left-1/2 h-2 w-px bg-[var(--muted)]/40" />
                  <span
                    className={"absolute top-0 h-2 rounded-full " + (diff < 0 ? "bg-[#d9a184]" : "bg-[var(--accent)]")}
                    style={diff < 0 ? { right: "50%", width: `${width}%` } : { left: "50%", width: `${width}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {lower
                    ? `On days with ${tag.en.toLowerCase()}, your mood has been ${Math.abs(diff).toFixed(1)} lower than usual.`
                    : higher
                      ? `On days with ${tag.en.toLowerCase()}, your mood has been ${diff.toFixed(1)} higher than usual.`
                      : `Days with ${tag.en.toLowerCase()} look about like your usual.`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {factors.length > 0 && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Based only on your own check-ins from the last 30 days. Patterns, not proof: more check-ins make them clearer.
        </p>
      )}
    </section>
  );
}
