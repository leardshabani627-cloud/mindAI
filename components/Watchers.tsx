"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localDate } from "@/lib/dates";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { lockNow, useAppLock } from "@/lib/useAppLock";

// Two quiet helpers that run on every page of the app (not on the sign-in pages):
// - LockWatcher: with the app lock on, locks Mind after the chosen minutes without activity,
//   or when you come back to the tab after that long.
// - ReminderWatcher: at the time you chose, a gentle "How are you today?" if you haven't checked in yet.

const OUTSIDE_APP = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/lock", "/upgrade", "/welcome"];
const REMINDED_KEY = "mind-reminded"; // the date of the last reminder, so it comes once a day
const REMINDER_WINDOW_MIN = 120; // after this long past the time, today's reminder is skipped

const en = {
  title: "How are you today?",
  body: "A quick check-in, whenever you're ready.",
  checkIn: "Check in",
  close: "Close",
};
const COPY = {
  en,
  sq: {
    title: "Si je sot?",
    body: "Një kontroll i shpejtë, kur të jesh gati.",
    checkIn: "Regjistro gjendjen",
    close: "Mbyll",
  } satisfies typeof en,
};

/** Signed in with a real account (guests have no lock or mood check-ins). */
function useAccount() {
  const [account, setAccount] = useState(false);
  useEffect(() => {
    browserClient()
      .auth.getSession()
      .then(({ data }) => setAccount(!!data.session && data.session.user.is_anonymous !== true));
  }, []);
  return account;
}

export default function Watchers() {
  const path = usePathname();
  const account = useAccount();
  if (!account || OUTSIDE_APP.some((p) => path.startsWith(p))) return null;
  return (
    <>
      <LockWatcher />
      <ReminderWatcher />
    </>
  );
}

function LockWatcher() {
  const lock = useAppLock();
  const lastActive = useRef(Date.now());

  useEffect(() => {
    if (!lock?.enabled) return;
    const idleMs = lock.minutes * 60_000;
    const touch = () => (lastActive.current = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    // Left open and untouched: lock it.
    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > idleMs) lockNow();
    }, 15_000);

    // Back to the tab after a while: the server decides whether it's still unlocked.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActive.current > idleMs) return void lockNow();
      fetch("/api/lock/settings").then((r) => {
        if (r.status === 423) lockNow();
      });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lock?.enabled, lock?.minutes]);

  return null;
}

function ReminderWatcher() {
  const t = useCopy(COPY);
  const [reminder, setReminder] = useState<{ enabled: boolean; time: string } | null>(null);
  const [toast, setToast] = useState(false);

  // The chosen time (and again whenever Settings saves a change).
  useEffect(() => {
    const load = () =>
      fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s && setReminder({ enabled: s.reminder_enabled === true, time: s.reminder_time ?? "20:00" }))
        .catch(() => {});
    load();
    window.addEventListener("mind-settings-changed", load);
    return () => window.removeEventListener("mind-settings-changed", load);
  }, []);

  useEffect(() => {
    if (!reminder?.enabled) return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    async function check() {
      const now = new Date();
      const today = localDate(now);
      try {
        if (localStorage.getItem(REMINDED_KEY) === today) return;
      } catch {
        return;
      }
      const [h, m] = reminder!.time.split(":").map(Number);
      const minutesPast = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
      if (minutesPast < 0 || minutesPast > REMINDER_WINDOW_MIN) return;

      try {
        localStorage.setItem(REMINDED_KEY, today); // once a day, even if the check below fails
      } catch {}
      // Already checked in today? Then there's nothing to remind about.
      const mood = await fetch("/api/mood").then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (mood?.entries?.some((e: { entry_date: string }) => e.entry_date === today)) return;

      // Looking at Mind right now: a gentle message on screen. Otherwise: a notification.
      if (document.visibilityState === "visible" || !("Notification" in window) || Notification.permission !== "granted") {
        setToast(true);
        return;
      }
      const options = { body: t.body, icon: "/icon.svg", tag: "mind-checkin", data: { url: "/" } };
      const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
      if (registration) registration.showNotification(t.title, options);
      else new Notification(t.title, options);
    }

    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [reminder, t]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className="animate-rise fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 pl-4 shadow-[0_20px_50px_-20px_rgba(20,50,30,0.5)] backdrop-blur-xl"
    >
      <span className="text-2xl" aria-hidden>
        🌤️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{t.title}</p>
        <p className="truncate text-sm text-[var(--muted)]">{t.body}</p>
      </div>
      <Link
        href="/"
        onClick={() => setToast(false)}
        className="shrink-0 rounded-full bg-[var(--accent)] px-3.5 py-2 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)]"
      >
        {t.checkIn}
      </Link>
      <button onClick={() => setToast(false)} aria-label={t.close} className="shrink-0 px-1 text-[var(--muted)] hover:text-[var(--fg)]">
        ✕
      </button>
    </div>
  );
}
