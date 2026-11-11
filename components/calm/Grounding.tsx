"use client";

import Link from "next/link";
import { useState } from "react";
import { useCopy } from "@/lib/i18n";

// 5-4-3-2-1 grounding: bring attention back to the room through the senses.
const en = {
  steps: [
    { n: 5, what: "things you can see", hint: "a colour, a shape, light on a wall…" },
    { n: 4, what: "things you can touch", hint: "your clothes, the chair, your hands…" },
    { n: 3, what: "things you can hear", hint: "traffic, your breath, a fridge…" },
    { n: 2, what: "things you can smell", hint: "the air, soap, coffee…" },
    { n: 1, what: "thing you can taste", hint: "a sip of water, toothpaste…" },
  ],
  hereNow: "You're here, right now.",
  oneMore: "Take one more slow breath.",
  again: "Again",
  talk: "Talk about it",
  done: "Done",
  stepOf: (n: number) => `Step ${n} of 5`,
  forExample: "For example:",
  group: (n: number, what: string) => `Tap once for each of the ${n} ${what}`,
  noticed: "Noticed",
  tapWhen: "Tap when you notice one",
  tapHint: "Tap a circle each time you notice one. Take your time.",
};
const COPY = {
  en,
  sq: {
    steps: [
      { n: 5, what: "gjëra që i sheh", hint: "një ngjyrë, një formë, dritën në mur…" },
      { n: 4, what: "gjëra që i prek", hint: "rrobat, karrigen, duart e tua…" },
      { n: 3, what: "tinguj që i dëgjon", hint: "makinat, frymëmarrjen tënde, frigoriferin…" },
      { n: 2, what: "aroma që i nuhat", hint: "ajrin, sapunin, kafen…" },
      { n: 1, what: "shije që e ndien", hint: "një gllënjkë ujë, pastën e dhëmbëve…" },
    ],
    hereNow: "Je këtu, tani.",
    oneMore: "Merr edhe një frymë të ngadaltë.",
    again: "Edhe një herë",
    talk: "Fol për këtë",
    done: "Mbaroi",
    stepOf: (n: number) => `Hapi ${n} nga 5`,
    forExample: "Për shembull:",
    group: (n: number, what: string) => `Prek një herë për secilën nga ${n} ${what}`,
    noticed: "E vura re",
    tapWhen: "Prek kur e vë re një",
    tapHint: "Prek një rreth sa herë që vë re diçka. Merre me qetësi.",
  } satisfies typeof en,
};

export default function Grounding() {
  const t = useCopy(COPY);
  const STEPS = t.steps;
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
        <p className="text-2xl tracking-tight">{t.hereNow}</p>
        <p className="text-[var(--muted)]">{t.oneMore}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setStep(0);
              setNoticed(0);
            }}
            className="rounded-full border border-[var(--line)] px-5 py-2 text-base"
          >
            {t.again}
          </button>
          <Link href="/chat" className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)]">
            {t.talk}
          </Link>
          <Link href="/" className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
            {t.done}
          </Link>
        </div>
      </div>
    );
  }

  const s = STEPS[step];

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-sm text-[var(--muted)]">{t.stepOf(step + 1)}</p>
      <p className="mt-2 text-6xl tracking-tight text-[var(--accent)]">{s.n}</p>
      <p className="text-2xl tracking-tight">{s.what}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.forExample} {s.hint}</p>

      <div className="mt-8 flex gap-3" role="group" aria-label={t.group(s.n, s.what)}>
        {Array.from({ length: s.n }, (_, i) => (
          <button
            key={`${step}-${i}`}
            onClick={i === noticed ? notice : undefined}
            aria-label={i < noticed ? t.noticed : t.tapWhen}
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
      <p className="mt-4 text-sm text-[var(--muted)]">{t.tapHint}</p>
    </div>
  );
}
