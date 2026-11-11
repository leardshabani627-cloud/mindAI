"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CrisisBanner from "@/components/CrisisBanner";
import { useCopy } from "@/lib/i18n";
import type { Settings } from "@/lib/settings";

const en = {
  button: "Help",
  label: "I need help now",
  title: "You're not alone",
  intro: "Here's what you set up for a hard moment. Reaching out to one person is enough.",
  loading: "One moment…",
};
const COPY = {
  en,
  sq: {
    button: "Ndihmë",
    label: "Kam nevojë për ndihmë tani",
    title: "Nuk je vetëm",
    intro: "Ja çfarë ke përgatitur për një moment të vështirë. Mjafton të kontaktosh një person.",
    loading: "Një moment…",
  } satisfies typeof en,
};

const SETTINGS_CACHE = "mind-settings"; // the chat keeps a copy too, so help shows even on a slow network

/** The always-visible "I need help now" button, and the panel it opens. */
export default function HelpButton({ tone = "light" }: { tone?: "light" | "onGreen" }) {
  const t = useCopy(COPY);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE);
      if (cached) setSettings(JSON.parse(cached));
    } catch {}
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Settings | null) => s && setSettings(s))
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t.label}
        title={t.label}
        className={
          "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition " +
          (tone === "onGreen"
            ? "border border-white/50 bg-white/85 text-[#9a3b2a] hover:bg-white"
            : "glass text-[#9a3b2a] hover:bg-white")
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
        </svg>
        {t.button}
      </button>

      {/* Drawn at the top of the page: glass (blurred) containers would otherwise trap a fixed panel inside them. */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#1d2a20]/35 p-4 text-left text-[var(--fg)] backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label={t.title}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="animate-rise w-full max-w-md">
            <div className="glass rounded-t-[1.75rem] px-5 pt-5 pb-3">
              <h2 className="text-2xl tracking-tight">{t.title}</h2>
            </div>
            <div className="glass rounded-b-[1.75rem] px-3 pb-3">
              {settings ? (
                <CrisisBanner
                  intro={t.intro}
                  contacts={settings.emergency_contacts ?? []}
                  resources={settings.crisis_resources ?? []}
                  plan={settings.safety_plan}
                  onClose={() => setOpen(false)}
                />
              ) : (
                <p className="px-2 py-4 text-[var(--muted)]">{t.loading}</p>
              )}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
