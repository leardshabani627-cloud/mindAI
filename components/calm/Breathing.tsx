"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Slow breathing: in for 4, out for 6. A longer out-breath helps the body settle.
const PHASES = [
  { en: "Breathe in", sq: "Merr frymë", secs: 4, scale: 1 },
  { en: "Breathe out", sq: "Nxirre ngadalë", secs: 6, scale: 0.58 },
];
const TOTAL_SECONDS = 120; // about 12 slow breaths

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Breathing() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(PHASES[0].secs); // seconds left in this phase
  const [elapsed, setElapsed] = useState(0);
  const done = elapsed >= TOTAL_SECONDS && phase === 0 && left === PHASES[0].secs;

  useEffect(() => {
    if (!running || done) return;
    const timer = setTimeout(() => {
      setElapsed((e) => e + 1);
      if (left > 1) return setLeft(left - 1);
      const next = (phase + 1) % PHASES.length;
      setPhase(next);
      setLeft(PHASES[next].secs);
      navigator.vibrate?.(25); // a tiny tap on phones when the breath changes
    }, 1000);
    return () => clearTimeout(timer);
  }, [running, done, left, phase]);

  function restart() {
    setPhase(0);
    setLeft(PHASES[0].secs);
    setElapsed(0);
    setRunning(true);
  }

  const current = PHASES[phase];

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-2xl tracking-tight">Well done.</p>
        <p className="text-[var(--muted)]">Të lumtë. How do you feel now?</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={restart} className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
            Again
          </button>
          <Link href="/chat" className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)]">
            Talk about it
          </Link>
          <Link href="/" className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
            I feel calmer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="relative grid h-64 w-64 place-items-center sm:h-72 sm:w-72">
        {/* resting outline */}
        <span className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--check)]" />
        {/* the breathing circle: grows over 4 s, shrinks over 6 s */}
        <span
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#cfe0c6_45%,#95ab8b)] shadow-[0_30px_60px_-30px_rgba(60,100,60,0.7)] motion-reduce:transition-none"
          style={{
            transform: `scale(${running ? current.scale : 0.58})`,
            transition: `transform ${running ? current.secs : 0.6}s ease-in-out`,
          }}
        />
        <span className="relative text-center">
          {running ? (
            <>
              <span className="block text-2xl tracking-tight">{current.en}</span>
              <span className="block text-sm text-[#4b5a4a]">{current.sq}</span>
              <span className="mt-1 block text-3xl tabular-nums">{left}</span>
            </>
          ) : (
            <span className="block text-lg">Ready when you are</span>
          )}
        </span>
      </div>

      <p className="mt-8 text-sm text-[var(--muted)] tabular-nums">
        {mmss(Math.max(0, TOTAL_SECONDS - elapsed))} left · in for 4, out for 6
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-base text-[var(--on-accent)]"
        >
          {running ? "Pause" : elapsed > 0 ? "Continue" : "Start"}
        </button>
        {elapsed > 0 && (
          <button onClick={restart} className="rounded-full border border-[var(--line)] px-5 py-2.5 text-base">
            Restart
          </button>
        )}
      </div>
    </div>
  );
}
