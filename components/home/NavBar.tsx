import Link from "next/link";
import TopMenu from "@/components/TopMenu";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/journal", label: "Journal" },
  { href: "/calm", label: "Calm" },
  { href: "/insights", label: "Insights" },
  { href: "/memory", label: "Memory" },
];

const pill = "glass rounded-full";

// Top bar: logo, page tabs, who is signed in, and settings.
export default function NavBar({ email }: { email: string }) {
  const name = email.split("@")[0] || "You";

  return (
    <nav className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link href="/" className={`${pill} flex items-center gap-2 px-4 py-2 text-base font-normal tracking-tight`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--accent)]">
            <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
          </svg>
          Mind
        </Link>

        <div className={`${pill} hidden items-center gap-1 p-1 md:flex`}>
          {TABS.map((t) =>
            t.href === "/" ? (
              <span key={t.href} className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm text-[var(--on-accent)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5z" />
                </svg>
                {t.label}
              </span>
            ) : (
              <Link key={t.href} href={t.href} className="rounded-full px-4 py-1.5 text-sm text-[var(--fg)]/80 hover:bg-[var(--accent-soft)]">
                {t.label}
              </Link>
            ),
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2.5 pr-1 sm:flex">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c4e6d6_45%,#9fc4e8)] text-sm font-medium text-[#2a4a3a]">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="leading-tight">
            <span className="block max-w-[11rem] truncate text-sm font-medium">{name}</span>
            <span className="block text-xs text-[var(--muted)]">Private space</span>
          </span>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className={`${pill} grid h-10 w-10 place-items-center text-[var(--muted)] hover:text-[var(--fg)]`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
        <div className="md:hidden">
          <TopMenu current="/" />
        </div>
      </div>
    </nav>
  );
}
