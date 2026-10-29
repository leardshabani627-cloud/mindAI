"use client";

import Link from "next/link";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import { useCopy } from "@/lib/i18n";
import { telHref } from "@/lib/phone";
import type { SafetyPlan } from "@/lib/safetyPlan";
import type { Contact } from "@/lib/settings";

const en = {
  intro: "I'm really glad you said that out loud. You don't have to carry it alone. If you might be in danger, please reach out to someone now.",
  close: "Close",
  reasons: "Your reasons to keep going",
  helps: "Things that help you",
  people: "People I trust",
  resources: "Crisis resources",
  breathe: "Breathe with me for 2 minutes →",
  plan: "Open my safety plan →",
  noneBefore: "You haven't saved anyone you trust yet.",
  noneLink: "Add them in Settings, so they're one tap away here",
  edit: "Edit in Settings",
};
const COPY = {
  en,
  sq: {
    intro: "Më vjen shumë mirë që e the me zë. Nuk ke pse ta mbash vetëm. Nëse mund të jesh në rrezik, të lutem kontakto dikë tani.",
    close: "Mbyll",
    reasons: "Arsyet e tua për të vazhduar",
    helps: "Gjërat që të ndihmojnë",
    people: "Njerëzit që u besoj",
    resources: "Linjat e krizës",
    breathe: "Merr frymë me mua për 2 minuta →",
    plan: "Hap planin tim të sigurisë →",
    noneBefore: "Nuk ke ruajtur ende askënd që i beson.",
    noneLink: "Shtoji te Cilësimet, që të jenë një prekje larg këtu",
    edit: "Ndrysho te Cilësimet",
  } satisfies typeof en,
};

type Props = {
  intro?: string; // replaces the opening line
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
export default function CrisisBanner({ intro, contacts, resources, plan, onClose }: Props) {
  const t = useCopy(COPY);
  const reasons = plan?.reasons ?? [];
  const coping = (plan?.coping ?? []).slice(0, 2);
  const empty = contacts.length === 0 && resources.length === 0;

  return (
    <div role="status" className="mb-3 rounded-2xl glass px-4 py-4 ring-1 ring-[var(--accent)]">
      <div className="flex items-start justify-between gap-3">
        <p>{intro ?? t.intro}</p>
        <button onClick={onClose} aria-label={t.close} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ✕
        </button>
      </div>

      <div className="mt-3">
        <EmergencyNumbers />
      </div>

      {reasons.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-[var(--muted)]">{t.reasons}</p>
          <p>{reasons.join(" · ")}</p>
        </div>
      )}
      {coping.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-[var(--muted)]">{t.helps}</p>
          <p>{coping.join(" · ")}</p>
        </div>
      )}

      <List title={t.people} items={contacts} />
      <List title={t.resources} items={resources} />

      <Link
        href="/calm"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm text-[var(--accent)]"
      >
        {t.breathe}
      </Link>{" "}
      <Link
        href="/safety-plan"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm text-[var(--accent)]"
      >
        {t.plan}
      </Link>

      {empty ? (
        <p className="mt-3">
          {t.noneBefore}{" "}
          <Link href="/settings" className="underline">
            {t.noneLink}
          </Link>
          .
        </p>
      ) : (
        <p className="mt-3 text-sm">
          <Link href="/settings" className="text-[var(--muted)] underline">
            {t.edit}
          </Link>
        </p>
      )}
    </div>
  );
}
