const BARS = 40;

// A calm resting shape, shown when nothing is being recorded.
const RESTING = Array.from({ length: BARS }, (_, i) => 0.12 + 0.5 * Math.abs(Math.sin(i * 0.62) * Math.cos(i * 0.21)));

/** Vertical bars. While recording they follow your voice; otherwise they rest softly. */
export default function Waveform({ levels, active, className = "h-16" }: { levels: number[]; active: boolean; className?: string }) {
  const heights = active
    ? [...Array(Math.max(0, BARS - levels.length)).fill(0.06), ...levels].map((l) => Math.max(0.06, l))
    : RESTING;

  return (
    <div aria-hidden className={`flex items-center gap-[3px] transition-[height] ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] flex-1 rounded-full bg-white transition-[height] duration-100"
          style={{ height: `${Math.round(h * 100)}%`, opacity: active ? 0.95 : i > BARS - 6 ? Math.round((55 - (i - (BARS - 6)) * 8)) / 100 : 0.55 }}
        />
      ))}
    </div>
  );
}
