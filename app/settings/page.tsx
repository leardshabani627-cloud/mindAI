"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import type { Contact } from "@/lib/settings";

const field =
  "min-w-0 flex-1 rounded-xl bg-[var(--bg)] px-3 py-2 text-base outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]";

function ContactList({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
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
            <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" className={field} />
            <input
              value={c.detail}
              onChange={(e) => update(i, { detail: e.target.value })}
              placeholder="Phone or how to reach"
              className={field}
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

export default function SettingsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [resources, setResources] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setContacts(s.emergency_contacts);
        setResources(s.crisis_resources);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setStatus("Saving…");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergency_contacts: contacts, crisis_resources: resources }),
    });
    setStatus(res.ok ? "Saved." : "Couldn't save. Please try again.");
    if (res.ok) {
      try {
        localStorage.removeItem("mind-settings"); // the chat re-reads the saved version
      } catch {}
    }
  }

  async function signOut() {
    await browserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function deleteEverything() {
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) return setStatus("Couldn't delete everything. Please try again.");
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("mind-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    await signOut();
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <span className="text-xl tracking-wide">Settings</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          Home
        </Link>
      </header>

      {loaded && (
        <>
          <ContactList
            title="People I trust"
            hint="Friends or family I can turn to in a hard moment. Shown if a message sounds like I may be in danger."
            items={contacts}
            onChange={setContacts}
          />
          <ContactList
            title="Crisis resources"
            hint="Hotlines or services for where I live. Look up the right ones for my country and add them here."
            items={resources}
            onChange={setResources}
          />
          <div className="mb-10 flex items-center gap-4">
            <button onClick={save} className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">
              Save
            </button>
            <span className="text-[var(--muted)]">{status}</span>
          </div>

          <section className="mb-6 rounded-2xl glass px-4 py-4">
            <h2 className="mb-3">Account</h2>
            <button onClick={signOut} className="text-[var(--accent)]">
              Sign out
            </button>
          </section>

          <section className="rounded-2xl glass px-4 py-4">
            <h2 className="mb-1">Delete all my data</h2>
            <p className="mb-3 text-base text-[var(--muted)]">
              Permanently erases every conversation, memory, mood check-in and setting. This can&apos;t be undone.
              Type DELETE to confirm.
            </p>
            <div className="flex flex-wrap gap-2">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" className={field} />
              <button
                onClick={deleteEverything}
                disabled={confirmText !== "DELETE"}
                className="rounded-xl bg-red-500/80 px-4 py-2 text-base text-white disabled:opacity-40"
              >
                Delete everything
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
