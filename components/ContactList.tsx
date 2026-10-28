"use client";

import { useCopy } from "@/lib/i18n";
import type { Contact } from "@/lib/settings";

const en = { name: "Name", reach: "Phone or how to reach", remove: "Remove", add: "+ Add" };
const COPY = {
  en,
  sq: { name: "Emri", reach: "Telefoni ose si mund ta kontaktosh", remove: "Hiqe", add: "+ Shto" } satisfies typeof en,
};

export const fieldClass =
  "min-w-0 flex-1 rounded-xl bg-[var(--bg)] px-3 py-2 text-base outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]";

/** Editable list of { name, how to reach } pairs. Used in Settings and in the safety plan. */
export default function ContactList({
  title,
  hint,
  items,
  onChange,
}: {
  title: React.ReactNode;
  hint: string;
  items: Contact[];
  onChange: (items: Contact[]) => void;
}) {
  const t = useCopy(COPY);
  const update = (i: number, patch: Partial<Contact>) =>
    onChange(items.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <section className="mb-6 rounded-2xl glass px-4 py-4">
      <h2 className="mb-1">{title}</h2>
      <p className="mb-3 text-base text-[var(--muted)]">{hint}</p>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder={t.name} className={fieldClass} />
            <input
              value={c.detail}
              onChange={(e) => update(i, { detail: e.target.value })}
              placeholder={t.reach}
              className={fieldClass}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={t.remove}
              className="px-2 text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {items.length < 10 && (
        <button onClick={() => onChange([...items, { name: "", detail: "" }])} className="mt-3 text-base text-[var(--accent)]">
          {t.add}
        </button>
      )}
    </section>
  );
}
