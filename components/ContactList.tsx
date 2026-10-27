"use client";

import type { Contact } from "@/lib/settings";

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
  const update = (i: number, patch: Partial<Contact>) =>
    onChange(items.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <section className="mb-6 rounded-2xl glass px-4 py-4">
      <h2 className="mb-1">{title}</h2>
      <p className="mb-3 text-base text-[var(--muted)]">{hint}</p>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" className={fieldClass} />
            <input
              value={c.detail}
              onChange={(e) => update(i, { detail: e.target.value })}
              placeholder="Phone or how to reach"
              className={fieldClass}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="px-2 text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {items.length < 10 && (
        <button onClick={() => onChange([...items, { name: "", detail: "" }])} className="mt-3 text-base text-[var(--accent)]">
          + Add
        </button>
      )}
    </section>
  );
}
