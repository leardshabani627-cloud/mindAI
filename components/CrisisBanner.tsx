import Link from "next/link";
import { telHref } from "@/lib/phone";
import type { SafetyPlan } from "@/lib/safetyPlan";
import type { Contact } from "@/lib/settings";

type Props = {
  contacts: Contact[];
  resources: Contact[];
  plan?: SafetyPlan;
  onClose: () => void;
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
export default function CrisisBanner({ contacts, resources, plan, onClose }: Props) {
  const reasons = plan?.reasons ?? [];
  const coping = (plan?.coping ?? []).slice(0, 2);
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

      {reasons.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-[var(--muted)]">Your reasons to keep going</p>
          <p>{reasons.join(" · ")}</p>
        </div>
      )}
      {coping.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-[var(--muted)]">Things that help you</p>
          <p>{coping.join(" · ")}</p>
        </div>
      )}

      <List title="People I trust" items={contacts} />
      <List title="Crisis resources" items={resources} />

      <Link
        href="/calm"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm text-[var(--accent)]"
      >
        Breathe with me for 2 minutes →
      </Link>{" "}
      <Link
        href="/safety-plan"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm text-[var(--accent)]"
      >
        Open my safety plan →
      </Link>

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
