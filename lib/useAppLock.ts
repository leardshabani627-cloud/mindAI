"use client";

import { useEffect, useState } from "react";

export type LockState = { enabled: boolean; minutes: number; available: boolean };

const EVENT = "mind-lock-changed";
let cached: Promise<LockState | null> | null = null;

function load() {
  cached ??= fetch("/api/lock/settings")
    .then((r) => (r.ok ? (r.json() as Promise<LockState>) : null))
    .catch(() => null);
  return cached;
}

/** Tell every part of the page that the lock was turned on, off or changed. */
export function lockChanged(state: LockState) {
  cached = Promise.resolve(state);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
}

/** Go to the PIN screen now, coming back to this page after unlocking. */
export async function lockNow() {
  await fetch("/api/lock/now", { method: "POST" }).catch(() => {});
  location.href = `/lock?next=${encodeURIComponent(location.pathname)}`;
}

/** The app lock's current state (null while loading, or for someone signed out). */
export function useAppLock() {
  const [state, setState] = useState<LockState | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((s) => alive && setState(s));
    const onChange = (e: Event) => setState((e as CustomEvent<LockState>).detail);
    window.addEventListener(EVENT, onChange);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);
  return state;
}
