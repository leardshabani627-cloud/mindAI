"use client";

import Link from "next/link";
import { useState } from "react";

// 5-4-3-2-1 grounding: bring attention back to the room through the senses.
const STEPS = [
  { n: 5, en: "things you can see", sq: "gjëra që i sheh", hint: "a colour, a shape, light on a wall…" },
  { n: 4, en: "things you can touch", sq: "gjëra që i prek", hint: "your clothes, the chair, your hands…" },
  { n: 3, en: "things you can hear", sq: "tinguj që i dëgjon", hint: "traffic, your breath, a fridge…" },
  { n: 2, en: "things you can smell", sq: "aroma që i nuhat", hint: "the air, soap, coffee…" },
  { n: 1, en: "thing you can taste", sq: "shije që e ndien", hint: "a sip of water, toothpaste…" },
];

export default function Grounding() {
  const [step, setStep] = useState(0);
  const [noticed, setNoticed] = useState(0);
  const done = step >= STEPS.length;

  function notice() {
    const s = STEPS[step];
    if (noticed + 1 < s.n) return setNoticed(noticed + 1);
    setStep(step + 1); // that sense is done: move on
    setNoticed(0);
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-2xl tracking-tight">You&apos;re here, right now.</p>
        <p className="text-[var(--muted)]">Je këtu, tani. Take one more slow breath.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setStep(0);
              setNoticed(0);
            }}
            className="rounded-full border border-[var(--line)] px-5 py-2 text-base"
          >
            Again
          </button>
          <Link href="/chat" className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)]">
            Talk about it
          </Link>
          <Link href="/" className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
            Done
          </Link>
        </div>
      </div>
    );
  }

  const s = STEPS[step];

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-sm text-[var(--muted)]">Step {step + 1} of 5</p>
      <p className="mt-2 text-6xl tracking-tight text-[var(--accent)]">{s.n}</p>
      <p className="text-2xl tracking-tight">{s.en}</p>
      <p className="text-[var(--muted)]">{s.sq}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">For example: {s.hint}</p>

      <div className="mt-8 flex gap-3" role="group" aria-label={`Tap once for each of the ${s.n} ${s.en}`}>
        {Array.from({ length: s.n }, (_, i) => (
          <button
            key={`${step}-${i}`}
            onClick={i === noticed ? notice : undefined}
            aria-label={i < noticed ? "Noticed" : "Tap when you notice one"}
            className={
              "h-12 w-12 rounded-full border-2 transition " +
              (i < noticed
                ? "border-[var(--accent)] bg-[var(--accent)]"
                : i === noticed
                  ? "animate-pulse border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--check)] bg-transparent")
            }
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">Tap a circle each time you notice one. Take your time.</p>
    </div>
  );
}
