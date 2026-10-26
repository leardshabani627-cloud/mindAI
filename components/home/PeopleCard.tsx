import Link from "next/link";

type Contact = { name: string; detail: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "•";

const telHref = (detail: string) =>
  /^[\d\s()+.-]+$/.test(detail) && detail.replace(/\D/g, "").length >= 3 ? `tel:${detail.replace(/[^\d+]/g, "")}` : null;

function Row({ c }: { c: Contact }) {
  const href = telHref(c.detail);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-[var(--card-solid)] p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-sm text-[var(--accent)]">
        {initials(c.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{c.name || c.detail}</span>
        {c.name && <span className="block truncate text-sm text-[var(--muted)]">{c.detail}</span>}
      </span>
      {href && (
        <a
          href={href}
          aria-label={`Call ${c.name || c.detail}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--fg)] text-[var(--card-solid)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </svg>
        </a>
      )}
    </li>
  );
}

// The people and services you chose in Settings, close at hand. Nothing here is preset.
export default function PeopleCard({ contacts, resources, loaded }: {
  contacts: Contact[];
  resources: Contact[];
  loaded: boolean;
}) {
  const empty = contacts.length === 0 && resources.length === 0;

  return (
    <section className="glass relative flex h-full flex-col overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-2xl" />

      <div className="relative">
        <h2 className="text-xl font-medium tracking-tight">In a hard moment</h2>
        <p className="text-sm text-[var(--muted)]">The people you trust</p>
      </div>

      {loaded && empty && (
        <div className="relative mt-6 flex flex-1 flex-col justify-center rounded-3xl bg-[var(--card-solid)] p-5">
          <p className="text-base">Who would you reach out to on a hard day?</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add them, and any crisis line for where you live. They&apos;ll be one tap away.
          </p>
          <Link
            href="/settings"
            className="mt-4 self-start rounded-full bg-[var(--fg)] px-5 py-2 text-sm text-[var(--card-solid)]"
          >
            Add people
          </Link>
        </div>
      )}

      {!empty && (
        <div className="relative mt-5 flex-1 space-y-4">
          {contacts.length > 0 && (
            <ul className="space-y-2">
              {contacts.slice(0, 3).map((c, i) => (
                <Row key={i} c={c} />
              ))}
            </ul>
          )}
          {resources.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">Crisis lines</p>
              <ul className="space-y-2">
                {resources.slice(0, 2).map((c, i) => (
                  <Row key={i} c={c} />
                ))}
              </ul>
            </div>
          )}
          <Link href="/settings" className="inline-block text-sm text-[var(--muted)] hover:text-[var(--fg)]">
            Edit in Settings
          </Link>
        </div>
      )}

      <p className="relative mt-5 text-xs text-[var(--muted)]">
        Mind is an AI companion, not a therapist. In an emergency, call your local emergency number.
      </p>
    </section>
  );
}
