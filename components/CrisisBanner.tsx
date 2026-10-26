import Link from "next/link";
import type { Contact } from "@/lib/settings";

type Props = {
  contacts: Contact[];
  resources: Contact[];
  onClose: () => void;
};

// A phone number or text we can turn into a tap-to-call link; anything else stays plain text.
const telHref = (detail: string) => {
  const digits = detail.replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 3 && /^[\d\s()+.-]+$/.test(detail) ? `tel:${digits}` : null;
};

function List({ title, items }: { title: string; items: Contact[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <ul>
        {items.map((c, i) => {
          const href = telHref(c.detail);
          return (
            <li key={i}>
              {c.name}
              {c.name && c.detail && ": "}
              {href ? (
                <a href={href} className="underline">
                  {c.detail}
                </a>
              ) : (
                c.detail
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Shown (softly) when a message looks like self-harm or hopelessness.
// Every contact and resource here was entered by the user in Settings.
export default function CrisisBanner({ contacts, resources, onClose }: Props) {
  const empty = contacts.length === 0 && resources.length === 0;

  return (
    <div role="status" className="mb-3 rounded-2xl glass px-4 py-4 ring-1 ring-[var(--accent)]">
      <div className="flex items-start justify-between gap-3">
        <p>
          I&apos;m really glad you said that out loud. You don&apos;t have to carry it alone. If you might be in danger,
          please reach out to someone now.
        </p>
        <button onClick={onClose} aria-label="Close" className="text-[var(--muted)] hover:text-[var(--fg)]">
          ✕
        </button>
      </div>

      <List title="People I trust" items={contacts} />
      <List title="Crisis resources" items={resources} />

      {empty ? (
        <p className="mt-3">
          You haven&apos;t saved anyone yet. Call your local emergency number if you&apos;re in danger, and{" "}
          <Link href="/settings" className="underline">
            add your own contacts in Settings
          </Link>
          .
        </p>
      ) : (
        <p className="mt-3 text-sm">
          <Link href="/settings" className="text-[var(--muted)] underline">
            Edit in Settings
          </Link>
        </p>
      )}
    </div>
  );
}
