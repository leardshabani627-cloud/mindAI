import { localDate } from "@/lib/dates";

type Entry = { entry_date: string; mood: number; note: string };

const DAYS = 30;
const W = 600;
const H = 220;
const PAD = { left: 28, right: 12, top: 12, bottom: 28 };

// A plain SVG line chart of mood (1 to 10) over the last 30 days. No chart library needed.
export default function MoodChart({ entries }: { entries: Entry[] }) {
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
    .map((p) => ({ ...p, x: x(p.i), y: y(p.mood) }));

  const label = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mood over the last 30 days">
      {[1, 5, 10].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--muted)" strokeOpacity={0.25} strokeDasharray="4 4" />
          <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      <text x={PAD.left} y={H - 8} fontSize={12} fill="var(--muted)">
        {label(days[0])}
      </text>
      <text x={W - PAD.right} y={H - 8} fontSize={12} fill="var(--muted)" textAnchor="end">
        {label(days[DAYS - 1])}
      </text>

      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((p) => (
        <circle key={p.entry_date} cx={p.x} cy={p.y} r={4.5} fill="var(--accent)">
          <title>{`${label(p.entry_date)}: ${p.mood}/10${p.note ? ` - ${p.note}` : ""}`}</title>
        </circle>
      ))}
    </svg>
  );
}
