"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/journal", label: "Journal" },
  { href: "/calm", label: "Calm down (2 min)" },
  { href: "/safety-plan", label: "My safety plan" },
  { href: "/insights", label: "Insights" },
  { href: "/memory", label: "Memory" },
  { href: "/settings", label: "Settings" },
];

/** The small ⋯ menu. `children` adds page-specific items above the links. */
export default function TopMenu({ children, current }: { children?: React.ReactNode; current?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
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
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 z-30 mt-2 w-56 rounded-2xl text-[var(--fg)] border border-[var(--line)] bg-[var(--card-solid)] p-1.5 text-base shadow-xl"
        >
          {children}
          {LINKS.filter((l) => l.href !== current).map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2 hover:bg-[var(--accent-soft)]">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const menuItemClass = "w-full rounded-xl px-3 py-2 text-left hover:bg-[var(--accent-soft)]";
