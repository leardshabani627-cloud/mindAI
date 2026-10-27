"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ContactList, { fieldClass } from "@/components/ContactList";
import TopMenu from "@/components/TopMenu";
import { telHref } from "@/lib/phone";
import { PLAN_SECTIONS, planIsEmpty, type PlanKey, type SafetyPlan } from "@/lib/safetyPlan";
import type { Contact, Settings } from "@/lib/settings";

// Steps are numbered in the order they're used in a hard moment; the two contact lists are steps 4 and 5.
const STEP: Record<PlanKey, number> = { warning_signs: 1, coping: 2, distractions: 3, safe_steps: 6, reasons: 0 };

/** Editable list of short lines for one plan section. */
function LineList({ items, onChange, example }: { items: string[]; onChange: (v: string[]) => void; example: string }) {
  const list = items.length ? items : [""];
  return (
    <div className="space-y-2">
      {list.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={line}
            maxLength={200}
            onChange={(e) => onChange(list.map((l, j) => (j === i ? e.target.value : l)))}
            placeholder={i === 0 ? `e.g. ${example}` : ""}
            className={fieldClass}
          />
          {list.length > 1 && (
            <button
              onClick={() => onChange(list.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="px-2 text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {list.length < 10 && (
        <button onClick={() => onChange([...list, ""])} className="text-base text-[var(--accent)]">
          + Add
        </button>
      )}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm text-[var(--on-accent)]">
      {n === 0 ? "♥" : n}
    </span>
  );
}

function ContactLines({ items }: { items: Contact[] }) {
  return (
    <ul className="space-y-1">
      {items.map((c, i) => {
        const href = telHref(c.detail);
        return (
          <li key={i}>
            {c.name}
            {c.name && c.detail && ": "}
            {href ? (
              <a href={href} className="text-[var(--accent)] underline">
                {c.detail}
              </a>
            ) : (
              c.detail
            )}
          </li>
        );
      })}
    </ul>
  );
}

// My safety plan: written on a calmer day, read in a hard one.
export default function SafetyPlanPage() {
  const [plan, setPlan] = useState<SafetyPlan>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [resources, setResources] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  // What is saved on the server, so Cancel can undo unsaved edits.
  const [saved, setSaved] = useState<{ plan: SafetyPlan; contacts: Contact[]; resources: Contact[] }>({
    plan: {},
    contacts: [],
    resources: [],
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setPlan(s.safety_plan ?? {});
        setContacts(s.emergency_contacts);
        setResources(s.crisis_resources);
        setSaved({ plan: s.safety_plan ?? {}, contacts: s.emergency_contacts, resources: s.crisis_resources });
        // An empty plan opens ready to write; a written one opens ready to read.
        setEditing(planIsEmpty(s.safety_plan));
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setStatus("Saving…");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ safety_plan: plan, emergency_contacts: contacts, crisis_resources: resources }),
    }).catch(() => null);
    if (!res?.ok) return setStatus("Couldn't save. Please try again.");
    setStatus("");
    try {
      localStorage.removeItem("mind-settings"); // the chat re-reads the saved version
    } catch {}
    // Show it as it was saved (empty lines dropped).
    const clean = {
      plan: Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, (v ?? []).map((s) => s.trim()).filter(Boolean)])),
      contacts: contacts.filter((c) => c.name.trim() || c.detail.trim()),
      resources: resources.filter((c) => c.name.trim() || c.detail.trim()),
    };
    setPlan(clean.plan);
    setContacts(clean.contacts);
    setResources(clean.resources);
    setSaved(clean);
    setEditing(false);
  }

  const sections = PLAN_SECTIONS.filter((s) => s.key !== "safe_steps");
  const safeSteps = PLAN_SECTIONS.find((s) => s.key === "safe_steps")!;

  const viewSection = (s: (typeof PLAN_SECTIONS)[number]) =>
    plan[s.key]?.length ? (
      <section key={s.key} className="flex gap-3">
        <StepBadge n={STEP[s.key]} />
        <div className="min-w-0">
          <h2 className="text-lg tracking-tight">{s.en}</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {plan[s.key]!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  return (
    <main className="flex min-h-dvh justify-center p-3 sm:p-6">
      <div className="glass animate-rise w-full max-w-2xl rounded-[2.25rem] p-5 sm:p-8">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label="Back to home"
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)] print:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight">My safety plan</h1>
              <p className="text-sm text-[var(--muted)]">Plani im i sigurisë. Written on a calmer day, for a harder one.</p>
            </div>
          </div>
          <div className="print:hidden">
            <TopMenu current="/safety-plan" />
          </div>
        </header>

        {loaded && !editing && (
          <div className="mt-6 space-y-6">
            {/* Most important first: the reasons, then the steps in order. */}
            {viewSection(PLAN_SECTIONS[0])}
            {sections.slice(1).map(viewSection)}

            {contacts.length > 0 && (
              <section className="flex gap-3">
                <StepBadge n={4} />
                <div>
                  <h2 className="text-lg tracking-tight">People I can ask for help</h2>
                  <ContactLines items={contacts} />
                </div>
              </section>
            )}
            <section className="flex gap-3">
              <StepBadge n={5} />
              <div>
                <h2 className="text-lg tracking-tight">Professionals and crisis lines</h2>
                {resources.length > 0 ? (
                  <ContactLines items={resources} />
                ) : (
                  <p className="text-[var(--muted)]">If I&apos;m in danger, I call my local emergency number.</p>
                )}
              </div>
            </section>
            {viewSection(safeSteps)}

            <div className="flex flex-wrap gap-2 pt-2 print:hidden">
              <Link href="/calm" className="rounded-full bg-[var(--accent)] px-5 py-2 text-base text-[var(--on-accent)]">
                Breathe for 2 minutes
              </Link>
              <Link href="/chat" className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
                Talk to my companion
              </Link>
              <button onClick={() => setEditing(true)} className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
                Edit
              </button>
              <button onClick={() => window.print()} className="rounded-full border border-[var(--line)] px-5 py-2 text-base">
                Print
              </button>
            </div>
          </div>
        )}

        {loaded && editing && (
          <div className="mt-6">
            <p className="mb-6 text-base text-[var(--muted)]">
              Fill in what you can, in your own words. A few honest lines are enough, and you can change it any time.
              It&apos;s private: only you can see it.
            </p>

            {sections.map((s) => (
              <section key={s.key} className="mb-6 rounded-2xl glass px-4 py-4">
                <h2 className="mb-1 flex items-center gap-2">
                  <StepBadge n={STEP[s.key]} />
                  {s.en} <span className="text-sm text-[var(--muted)]">· {s.sq}</span>
                </h2>
                <p className="mb-3 text-base text-[var(--muted)]">{s.hint}</p>
                <LineList items={plan[s.key] ?? []} example={s.example} onChange={(v) => setPlan({ ...plan, [s.key]: v })} />
              </section>
            ))}

            <ContactList
              title={<span className="flex items-center gap-2"><StepBadge n={4} />People I can ask for help</span>}
              hint="Friends or family I can call or text when it gets hard."
              items={contacts}
              onChange={setContacts}
            />
            <ContactList
              title={<span className="flex items-center gap-2"><StepBadge n={5} />Professionals and crisis lines</span>}
              hint="My doctor or therapist, and crisis lines for where I live. Look up the right ones for my country."
              items={resources}
              onChange={setResources}
            />

            <section className="mb-6 rounded-2xl glass px-4 py-4">
              <h2 className="mb-1 flex items-center gap-2">
                <StepBadge n={6} />
                {safeSteps.en} <span className="text-sm text-[var(--muted)]">· {safeSteps.sq}</span>
              </h2>
              <p className="mb-3 text-base text-[var(--muted)]">{safeSteps.hint}</p>
              <LineList
                items={plan.safe_steps ?? []}
                example={safeSteps.example}
                onChange={(v) => setPlan({ ...plan, safe_steps: v })}
              />
            </section>

            <div className="flex items-center gap-4">
              <button onClick={save} className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">
                Save my plan
              </button>
              {!planIsEmpty(saved.plan) && (
                <button
                  onClick={() => {
                    setPlan(saved.plan);
                    setContacts(saved.contacts);
                    setResources(saved.resources);
                    setEditing(false);
                  }}
                  className="text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  Cancel
                </button>
              )}
              <span className="text-[var(--muted)]">{status}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
