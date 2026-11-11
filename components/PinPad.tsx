"use client";

import { useEffect, useState } from "react";
import { useCopy } from "@/lib/i18n";

const en = { delete: "Delete", digit: (d: string) => `Digit ${d}` };
const COPY = { en, sq: { delete: "Fshij", digit: (d: string) => `Shifra ${d}` } satisfies typeof en };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/**
 * Four dots and a number pad (typing on the keyboard works too).
 * When four digits are in, `onComplete` runs; if it returns an error message the dots shake and clear.
 */
export default function PinPad({
  onComplete,
  disabled = false,
}: {
  onComplete: (pin: string) => Promise<string | void> | string | void;
  disabled?: boolean;
}) {
  const t = useCopy(COPY);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  async function press(key: string) {
    if (disabled || busy) return;
    if (key === "del") return setPin((p) => p.slice(0, -1));
    if (!/^\d$/.test(key) || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length < 4) return;
    setBusy(true);
    const error = await onComplete(next);
    setBusy(false);
    if (error) {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 450);
    } else {
      setPin("");
    }
  }

  // Typing on a keyboard works too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center">
      <div className={"flex gap-4 py-2 " + (shake ? "animate-shake" : "")} aria-live="polite" aria-label={`${pin.length} / 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={
              "h-3.5 w-3.5 rounded-full border-2 transition " +
              (i < pin.length ? "scale-110 border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--accent)]/40")
            }
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              disabled={disabled || busy}
              aria-label={key === "del" ? t.delete : t.digit(key)}
              className={
                "grid h-16 w-16 place-items-center rounded-full text-2xl transition active:scale-95 disabled:opacity-40 " +
                (key === "del"
                  ? "text-base text-[var(--muted)] hover:text-[var(--fg)]"
                  : "border border-white/80 bg-white/60 text-[var(--fg)] shadow-sm backdrop-blur hover:bg-white/90")
              }
            >
              {key === "del" ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM17 9l-6 6M11 9l6 6" />
                </svg>
              ) : (
                key
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
