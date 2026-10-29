"use client";

import { localDate } from "@/lib/dates";
import { locale, useLang } from "@/lib/i18n";

type Entry = { entry_date: string; mood: number; note: string; tags?: string[] };

const DAYS = 30;
const W = 800;
const H = 260;
const PAD = { left: 30, right: 16, top: 16, bottom: 32 };

// A smooth line of mood (1 to 10) over the last 30 days, drawn as plain SVG (no chart library needed).
// Hover a point to see that day's mood and note.
export default function MoodChart({ entries }: { entries: Entry[] }) {
  const { lang } = useLang();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return localDate(d);
  });

  const x = (i: number) => PAD.left + (i / (DAYS - 1)) * (W - PAD.left - PAD.right);
  const y = (mood: number) => PAD.top + ((10 - mood) / 9) * (H - PAD.top - PAD.bottom);

  const points = entries
    .map((e) => ({ ...e, i: days.indexOf(e.entry_date) }))
    .filter((p) => p.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((p) => ({ ...p, x: x(p.i), y: y(p.mood) }));

  // A gentle curve through the points.
  const line = points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = points[i - 1];
      const mid = (prev.x + p.x) / 2;
      return `C${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
  const bottom = y(1);
  const area = points.length > 1 ? `${line} L${points[points.length - 1].x} ${bottom} L${points[0].x} ${bottom} Z` : "";

  const label = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale(lang), { month: "short", day: "numeric" });
  const ticks = [0, 7, 14, 21, DAYS - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={lang === "sq" ? "Gjendja në 30 ditët e fundit" : "Mood over the last 30 days"}>
      <defs>
        <linearGradient id="mood-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--fg)" strokeOpacity={0.07} />
          <text x={PAD.left - 10} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      {ticks.map((i) => (
        <text key={i} x={x(i)} y={H - 8} fontSize={12} fill="var(--muted)" textAnchor={i === 0 ? "start" : i === DAYS - 1 ? "end" : "middle"}>
          {label(days[i])}
        </text>
      ))}

      {area && <path d={area} fill="url(#mood-fill)" />}
      {points.length > 1 && <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />}
      {points.map((p) => (
        <circle key={p.entry_date} cx={p.x} cy={p.y} r={5} fill="#fff" stroke="var(--accent)" strokeWidth={2.5}>
          <title>{`${label(p.entry_date)}: ${p.mood}/10${p.note ? ` · ${p.note}` : ""}`}</title>
        </circle>
      ))}
    </svg>
  );
}
