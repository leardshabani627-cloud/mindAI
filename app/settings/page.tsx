"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import ContactList, { fieldClass as field } from "@/components/ContactList";
import type { Contact } from "@/lib/settings";

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

          <Link href="/safety-plan" className="mb-6 flex items-center justify-between gap-3 rounded-2xl glass px-4 py-4">
            <span>
              <span className="block">My safety plan</span>
              <span className="block text-base text-[var(--muted)]">
                Warning signs, what helps, and reasons to keep going, ready for a hard moment.
              </span>
            </span>
            <span className="text-[var(--accent)]">Open →</span>
          </Link>

          <section className="mb-6 rounded-2xl glass px-4 py-4">
            <h2 className="mb-3">Account</h2>
            <button onClick={signOut} className="text-[var(--accent)]">
              Sign out
            </button>
          </section>

          <section className="rounded-2xl glass px-4 py-4">
            <h2 className="mb-1">Delete all my data</h2>
            <p className="mb-3 text-base text-[var(--muted)]">
              Permanently erases every conversation, memory, mood check-in, journal entry and setting. This can&apos;t be undone.
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
