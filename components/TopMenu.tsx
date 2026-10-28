"use client";

import Link from "next/link";
import { useState } from "react";
import LockIcon from "@/components/LockIcon";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useCopy } from "@/lib/i18n";
import { useIsGuest } from "@/lib/useIsGuest";

const ACCOUNT_ONLY = ["/journal", "/safety-plan", "/letters", "/insights", "/memory"];

const en = {
  menu: "Menu",
  language: "Language",
  links: [
    { href: "/", label: "Home" },
    { href: "/chat", label: "Chat" },
    { href: "/journal", label: "Journal" },
    { href: "/calm", label: "Calm down (2 min)" },
    { href: "/safety-plan", label: "My safety plan" },
    { href: "/letters", label: "Weekly letters" },
    { href: "/insights", label: "Insights" },
    { href: "/memory", label: "Memory" },
    { href: "/settings", label: "Settings" },
  ],
};
const COPY = {
  en,
  sq: {
    menu: "Menyja",
    language: "Gjuha",
    links: [
      { href: "/", label: "Ballina" },
      { href: "/chat", label: "Bisedo" },
      { href: "/journal", label: "Ditari" },
      { href: "/calm", label: "Qetësohu (2 min)" },
      { href: "/safety-plan", label: "Plani im i sigurisë" },
      { href: "/letters", label: "Letrat e javës" },
      { href: "/insights", label: "Pasqyra" },
      { href: "/memory", label: "Kujtesa" },
      { href: "/settings", label: "Cilësimet" },
    ],
  } satisfies typeof en,
};

/** The small ⋯ menu, with the language switch. `children` adds page-specific items above the links. */
export default function TopMenu({ children, current }: { children?: React.ReactNode; current?: string }) {
  const [open, setOpen] = useState(false);
  const t = useCopy(COPY);
  const guest = useIsGuest();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.menu}
        aria-expanded={open}
        className="glass grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-[var(--line)] bg-[var(--card-solid)] p-1.5 text-base text-[var(--fg)] shadow-xl">
          <div onClick={() => setOpen(false)}>
            {children}
            {t.links
              .filter((l) => l.href !== current)
              .map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--accent-soft)]">
                  {l.label}
                  {guest && ACCOUNT_ONLY.includes(l.href) && <LockIcon size={13} className="text-[var(--muted)]" />}
                </Link>
              ))}
          </div>
          {/* Changing language keeps the menu open, so you can see it switch. */}
          <div className="mt-1 flex items-center justify-between border-t border-[var(--line)] px-3 pt-2 pb-1">
            <span className="text-sm text-[var(--muted)]">{t.language}</span>
            <LanguageSwitch />
          </div>
        </div>
      )}
    </div>
  );
}

export const menuItemClass = "w-full rounded-xl px-3 py-2 text-left hover:bg-[var(--accent-soft)]";
