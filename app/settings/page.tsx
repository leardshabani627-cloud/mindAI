"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import ContactList, { fieldClass as field } from "@/components/ContactList";
import LanguageSwitch from "@/components/LanguageSwitch";
import LockIcon from "@/components/LockIcon";
import { UPGRADE_PATH } from "@/lib/guest";
import { useIsGuest } from "@/lib/useIsGuest";
import { useCopy } from "@/lib/i18n";

const en = {
  title: "Settings",
  home: "Home",
  language: "Language",
  languageHint: "The language of every page and button. Your companion always answers in the language you write in.",
  nameTitle: "What Mind calls you",
  nameHint: "Your companion uses it now and then. Leave empty for no name.",
  namePlaceholder: "Your first name or a nickname",
  people: "People I trust",
  peopleHint: "Friends or family I can turn to in a hard moment. Shown if a message sounds like I may be in danger.",
  resources: "Crisis resources",
  resourcesHint: "Hotlines or services for where I live. Look up the right ones for my country and add them here.",
  save: "Save",
  saving: "Saving…",
  saved: "Saved.",
  saveFailed: "Couldn't save. Please try again.",
  plan: "My safety plan",
  planHint: "Warning signs, what helps, and reasons to keep going, ready for a hard moment.",
  open: "Open →",
  account: "Account",
  signOut: "Sign out",
  guestTitle: "You're visiting as a guest",
  guestHint: "Make a free account to keep this space: your chats, companion and settings come with you.",
  create: "Create a free account",
  leave: "Leave guest visit",
  leaveWarning: "Leaving ends this guest visit for good. Its chats and settings can't be opened again, even by you.",
  leaveAnyway: "Leave anyway",
  stay: "Stay",
  deleteTitle: "Delete all my data",
  deleteWord: "DELETE",
  deleteHint: (word: string) =>
    `Permanently erases every conversation, memory, mood check-in, journal entry, weekly letter and setting. This can't be undone. Type ${word} to confirm.`,
  deleteButton: "Delete everything",
  deleteFailed: "Couldn't delete everything. Please try again.",
};
const COPY = {
  en,
  sq: {
    title: "Cilësimet",
    home: "Ballina",
    language: "Gjuha",
    languageHint: "Gjuha e çdo faqeje dhe butoni. Shoqëruesi yt përgjigjet gjithmonë në gjuhën në të cilën shkruan.",
    nameTitle: "Si të thërret Mind",
    nameHint: "Shoqëruesi yt e përdor herë pas here. Lëre bosh nëse s'do emër.",
    namePlaceholder: "Emri yt ose një nofkë",
    people: "Njerëzit që u besoj",
    peopleHint: "Miq ose familjarë që mund t'u drejtohem në një moment të vështirë. Shfaqen nëse një mesazh tingëllon sikur mund të jem në rrezik.",
    resources: "Linjat e krizës",
    resourcesHint: "Linja ndihme ose shërbime ku jetoj. Kërko ato që vlejnë për vendin tim dhe shtoji këtu.",
    save: "Ruaj",
    saving: "Po ruhet…",
    saved: "U ruajt.",
    saveFailed: "Nuk u ruajt. Provo përsëri.",
    plan: "Plani im i sigurisë",
    planHint: "Shenjat paralajmëruese, çka ndihmon dhe arsyet për të vazhduar, gati për një moment të vështirë.",
    open: "Hape →",
    account: "Llogaria",
    signOut: "Dil",
    guestTitle: "Je këtu si mysafir",
    guestHint: "Krijo një llogari falas për ta ruajtur këtë hapësirë: bisedat, shoqëruesi dhe cilësimet vijnë me ty.",
    create: "Krijo një llogari falas",
    leave: "Dil nga vizita si mysafir",
    leaveWarning: "Nëse del, kjo vizitë si mysafir mbaron përgjithmonë. Bisedat dhe cilësimet e saj nuk hapen më, as nga ti.",
    leaveAnyway: "Dil gjithsesi",
    stay: "Qëndro",
    deleteTitle: "Fshi të gjitha të dhënat e mia",
    deleteWord: "FSHIJ",
    deleteHint: (word: string) =>
      `Fshin përgjithmonë çdo bisedë, kujtim, kontroll gjendjeje, shënim ditari, letër jave dhe cilësim. Kjo nuk kthehet më. Shkruaj ${word} për ta konfirmuar.`,
    deleteButton: "Fshi gjithçka",
    deleteFailed: "Nuk u fshi gjithçka. Provo përsëri.",
  } satisfies typeof en,
};
import type { Contact } from "@/lib/settings";

export default function SettingsPage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [resources, setResources] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const guest = useIsGuest();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setContacts(s.emergency_contacts);
        setName(s.display_name ?? "");
        setResources(s.crisis_resources);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setStatus(t.saving);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name, emergency_contacts: contacts, crisis_resources: resources }),
    });
    setStatus(res.ok ? t.saved : t.saveFailed);
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
    if (!res.ok) return setStatus(t.deleteFailed);
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
        <span className="text-xl tracking-wide">{t.title}</span>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
          {t.home}
        </Link>
      </header>

      {loaded && (
        <>
          <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass px-4 py-4">
            <span className="min-w-0 flex-1">
              <span className="block">{t.language}</span>
              <span className="block text-base text-[var(--muted)]">{t.languageHint}</span>
            </span>
            <LanguageSwitch />
          </section>

          <section className="mb-6 rounded-2xl glass px-4 py-4">
            <h2 className="mb-1">{t.nameTitle}</h2>
            <p className="mb-3 text-base text-[var(--muted)]">{t.nameHint}</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={t.namePlaceholder}
              className={field}
            />
          </section>

          <ContactList
            title={t.people}
            hint={t.peopleHint}
            items={contacts}
            onChange={setContacts}
          />
          <ContactList
            title={t.resources}
            hint={t.resourcesHint}
            items={resources}
            onChange={setResources}
          />
          <div className="mb-10 flex items-center gap-4">
            <button onClick={save} className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">
              {t.save}
            </button>
            <span className="text-[var(--muted)]">{status}</span>
          </div>

          <Link href="/safety-plan" className="mb-6 flex items-center justify-between gap-3 rounded-2xl glass px-4 py-4">
            <span>
              <span className="block">{t.plan}</span>
              <span className="block text-base text-[var(--muted)]">{t.planHint}</span>
            </span>
            <span className="text-[var(--accent)]">{guest ? <LockIcon size={16} className="text-[var(--muted)]" /> : t.open}</span>
          </Link>

          {guest ? (
            <section className="mb-6 rounded-2xl glass px-4 py-4">
              <h2 className="mb-1">{t.guestTitle}</h2>
              <p className="mb-4 text-base text-[var(--muted)]">{t.guestHint}</p>
              <Link href={UPGRADE_PATH} className="inline-flex rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">
                {t.create}
              </Link>
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                {confirmLeave ? (
                  <>
                    <p className="mb-3 text-base text-[var(--fg)]">{t.leaveWarning}</p>
                    <div className="flex gap-4">
                      <button onClick={signOut} className="text-red-600">
                        {t.leaveAnyway}
                      </button>
                      <button onClick={() => setConfirmLeave(false)} className="text-[var(--accent)]">
                        {t.stay}
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => setConfirmLeave(true)} className="text-[var(--muted)] hover:text-[var(--fg)]">
                    {t.leave}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="mb-6 rounded-2xl glass px-4 py-4">
              <h2 className="mb-3">{t.account}</h2>
              <button onClick={signOut} className="text-[var(--accent)]">
                {t.signOut}
              </button>
            </section>
          )}

          <section className="rounded-2xl glass px-4 py-4">
            <h2 className="mb-1">{t.deleteTitle}</h2>
            <p className="mb-3 text-base text-[var(--muted)]">
              {t.deleteHint(t.deleteWord)}
            </p>
            <div className="flex flex-wrap gap-2">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={t.deleteWord} className={field} />
              <button
                onClick={deleteEverything}
                disabled={confirmText.trim().toUpperCase() !== t.deleteWord}
                className="rounded-xl bg-red-500/80 px-4 py-2 text-base text-white disabled:opacity-40"
              >
                {t.deleteButton}
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
