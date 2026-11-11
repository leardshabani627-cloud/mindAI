"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import ContactList, { fieldClass as field } from "@/components/ContactList";
import LanguageSwitch from "@/components/LanguageSwitch";
import LockIcon from "@/components/LockIcon";
import PinPad from "@/components/PinPad";
import TopMenu from "@/components/TopMenu";
import { UPGRADE_PATH } from "@/lib/guest";
import type { Contact } from "@/lib/settings";
import { useIsGuest } from "@/lib/useIsGuest";
import { lockChanged, useAppLock } from "@/lib/useAppLock";
import { useCopy } from "@/lib/i18n";

const en = {
  title: "Settings",
  subtitle: "Your profile, language, safety and privacy.",
  backHome: "Back to home",
  nav: { profile: "Profile", preferences: "Preferences", safety: "Safety", account: "Account & security", data: "Privacy & data" },
  profileHint: "How Mind knows you.",
  nameTitle: "Display name",
  nameHint: "Your companion uses it now and then. Leave empty for no name.",
  namePlaceholder: "Your first name or a nickname",
  you: "You",
  guestBadge: "Guest",
  via: { email: "Email & password", google: "Google" } as Record<string, string>,
  preferencesHint: "Language and your daily reminder.",
  language: "App language",
  languageHint: "Every page and button. Your companion answers in the language you write in.",
  reminder: "Daily check-in reminder",
  reminderHint: "A gentle \"How are you today?\" at your time, if you haven't checked in yet.",
  reminderOpenTab: "Arrives while Mind is open in a tab, even in the background.",
  reminderBlocked: "Notifications are blocked in this browser, so it shows inside Mind instead.",
  appLock: "App lock",
  appLockHint: "Ask for a 4-digit PIN to open Mind.",
  appLockGuest: "Needs a free account.",
  lockAfter: "Lock after",
  lockAfterHint: "Minutes without activity before the PIN is needed again.",
  minutes: (n: number) => (n === 60 ? "1 hour" : n === 1 ? "1 minute" : `${n} minutes`),
  changePin: "Change PIN",
  pinNew: "Choose a 4-digit PIN",
  pinConfirm: "Type it once more",
  pinNewHint: "Not your bank PIN, and nothing too easy like 1234.",
  pinMismatch: "Those didn't match. Let's start again.",
  pinFailed: "Couldn't save the PIN. Please try again.",
  cancel: "Cancel",
  safetyHint: "The people and steps that matter in a hard moment.",
  people: "People I trust",
  peopleHint: "Friends or family you can turn to. Shown if a message sounds like you may be in danger.",
  resources: "Crisis resources",
  resourcesHint: "Hotlines or services where you live. Look up the right ones for your country.",
  plan: "My safety plan",
  planHint: "Warning signs, what helps, and reasons to keep going.",
  open: "Open",
  accountHint: "Signing in and out.",
  signedInAs: "Signed in as",
  signOut: "Sign out",
  guestTitle: "You're visiting as a guest",
  guestHint: "Make a free account to keep this space: your chats, companion and settings come with you.",
  create: "Create a free account",
  leave: "Leave guest visit",
  leaveWarning: "Leaving ends this guest visit for good. Its chats and settings can't be opened again, even by you.",
  leaveAnyway: "Leave anyway",
  stay: "Stay",
  dataHint: "Everything in Mind is private to you.",
  deleteTitle: "Delete all my data",
  deleteWord: "DELETE",
  deleteHint: (word: string) =>
    `Permanently erases every conversation, memory, mood check-in, journal entry, weekly letter and setting. This can't be undone. Type ${word} to confirm.`,
  deleteButton: "Delete everything",
  deleteFailed: "Couldn't delete everything. Please try again.",
  unsaved: "You have unsaved changes",
  discard: "Discard",
  save: "Save changes",
  saving: "Saving…",
  saved: "Saved",
  saveFailed: "Couldn't save. Please try again.",
};
const COPY = {
  en,
  sq: {
    title: "Cilësimet",
    subtitle: "Profili, gjuha, siguria dhe privatësia jote.",
    backHome: "Kthehu në ballinë",
    nav: { profile: "Profili", preferences: "Preferencat", safety: "Siguria", account: "Llogaria dhe siguria", data: "Privatësia" },
    profileHint: "Si të njeh Mind.",
    nameTitle: "Emri që shfaqet",
    nameHint: "Shoqëruesi yt e përdor herë pas here. Lëre bosh nëse s'do emër.",
    namePlaceholder: "Emri yt ose një nofkë",
    you: "Ti",
    guestBadge: "Mysafir",
    via: { email: "Email dhe fjalëkalim", google: "Google" } as Record<string, string>,
    preferencesHint: "Gjuha dhe kujtesa jote e përditshme.",
    language: "Gjuha e aplikacionit",
    languageHint: "Çdo faqe dhe buton. Shoqëruesi përgjigjet në gjuhën në të cilën shkruan.",
    reminder: "Kujtesa e përditshme",
    reminderHint: "Një \"Si je sot?\" e butë në orën tënde, nëse s'e ke regjistruar gjendjen ende.",
    reminderOpenTab: "Vjen kur Mind është i hapur në një skedë, edhe në sfond.",
    reminderBlocked: "Njoftimet janë të bllokuara në këtë shfletues, ndaj shfaqet brenda Mind.",
    appLock: "Kyçja me PIN",
    appLockHint: "Kërko një PIN me 4 shifra për të hapur Mind.",
    appLockGuest: "Kërkon llogari falas.",
    lockAfter: "Kyçe pas",
    lockAfterHint: "Minuta pa aktivitet para se të kërkohet PIN-i përsëri.",
    minutes: (n: number) => (n === 60 ? "1 orë" : n === 1 ? "1 minutë" : `${n} minuta`),
    changePin: "Ndrysho PIN-in",
    pinNew: "Zgjidh një PIN me 4 shifra",
    pinConfirm: "Shkruaje edhe një herë",
    pinNewHint: "Jo PIN-i i bankës, dhe asgjë shumë e lehtë si 1234.",
    pinMismatch: "Nuk përputhen. Le të fillojmë përsëri.",
    pinFailed: "PIN-i nuk u ruajt. Provo përsëri.",
    cancel: "Anulo",
    safetyHint: "Njerëzit dhe hapat që kanë rëndësi në një moment të vështirë.",
    people: "Njerëzit që u besoj",
    peopleHint: "Miq ose familjarë që mund t'u drejtohesh. Shfaqen nëse një mesazh tingëllon sikur mund të jesh në rrezik.",
    resources: "Linjat e krizës",
    resourcesHint: "Linja ndihme ose shërbime ku jeton. Kërko ato që vlejnë për vendin tënd.",
    plan: "Plani im i sigurisë",
    planHint: "Shenjat paralajmëruese, çka ndihmon dhe arsyet për të vazhduar.",
    open: "Hape",
    accountHint: "Hyrja dhe dalja.",
    signedInAs: "I kyçur si",
    signOut: "Dil",
    guestTitle: "Je këtu si mysafir",
    guestHint: "Krijo një llogari falas për ta ruajtur këtë hapësirë: bisedat, shoqëruesi dhe cilësimet vijnë me ty.",
    create: "Krijo një llogari falas",
    leave: "Dil nga vizita si mysafir",
    leaveWarning: "Nëse del, kjo vizitë si mysafir mbaron përgjithmonë. Bisedat dhe cilësimet e saj nuk hapen më, as nga ti.",
    leaveAnyway: "Dil gjithsesi",
    stay: "Qëndro",
    dataHint: "Gjithçka në Mind është private, vetëm për ty.",
    deleteTitle: "Fshi të gjitha të dhënat e mia",
    deleteWord: "FSHIJ",
    deleteHint: (word: string) =>
      `Fshin përgjithmonë çdo bisedë, kujtim, kontroll gjendjeje, shënim ditari, letër jave dhe cilësim. Kjo nuk kthehet më. Shkruaj ${word} për ta konfirmuar.`,
    deleteButton: "Fshi gjithçka",
    deleteFailed: "Nuk u fshi gjithçka. Provo përsëri.",
    unsaved: "Ke ndryshime të paruajtura",
    discard: "Anulo",
    save: "Ruaj ndryshimet",
    saving: "Po ruhet…",
    saved: "U ruajt",
    saveFailed: "Nuk u ruajt. Provo përsëri.",
  } satisfies typeof en,
};

type SectionId = keyof typeof en.nav;
const SECTIONS: SectionId[] = ["profile", "preferences", "data", "safety", "account"];
const LOCK_MINUTES = [1, 5, 15, 60];

// Small line icons for the side menu and section headings.
const ICONS: Record<SectionId, React.ReactNode> = {
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  preferences: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  safety: <path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6l-7-3Z" />,
  account: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  data: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
};

function Icon({ id, className = "" }: { id: SectionId; className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {ICONS[id]}
    </svg>
  );
}

/** A titled group of settings, like a card in a professional settings screen. */
function Section({ id, title, hint, danger = false, children }: { id: SectionId; title: string; hint: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex items-center gap-3">
        <span className={"grid h-9 w-9 place-items-center rounded-xl " + (danger ? "bg-red-50 text-red-600" : "bg-[var(--accent-soft)] text-[var(--accent-strong)]")}>
          <Icon id={id} />
        </span>
        <div>
          <h2 className="text-lg leading-tight tracking-tight">{title}</h2>
          <p className="text-sm text-[var(--muted)]">{hint}</p>
        </div>
      </div>
      <div
        className={
          "divide-y overflow-hidden rounded-2xl border bg-white/75 " +
          (danger ? "divide-red-100 border-red-200" : "divide-[var(--line)] border-[var(--line)]")
        }
      >
        {children}
      </div>
    </section>
  );
}

/** One setting: label and explanation on the left, the control on the right (or below, when `stacked`). */
function Row({ label, hint, stacked = false, children }: { label: React.ReactNode; hint?: string; stacked?: boolean; children?: React.ReactNode }) {
  return (
    <div className={"px-5 py-4 " + (stacked ? "" : "flex flex-wrap items-center justify-between gap-x-6 gap-y-3")}>
      <div className={stacked ? "mb-3" : "min-w-0 flex-1 basis-60"}>
        <p className="text-[15px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-sm text-[var(--muted)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

type Saved = { name: string; contacts: Contact[]; resources: Contact[]; reminderEnabled: boolean; reminderTime: string };

/** An on/off switch. */
function Toggle({ on, onChange, label, disabled = false }: { on: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={"relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 " + (on ? "bg-[var(--accent)]" : "bg-[var(--check)]")}
    >
      <span className={"absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all " + (on ? "left-6" : "left-1")} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [resources, setResources] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [notify, setNotify] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const lock = useAppLock();
  const [pinStep, setPinStep] = useState<null | "new" | "confirm">(null);
  const [firstPin, setFirstPin] = useState("");
  const [pinNote, setPinNote] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null); // what the server has, to notice unsaved changes
  const [status, setStatus] = useState<"" | "saving" | "saved" | "failed">("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");
  const [active, setActive] = useState<SectionId>("profile");
  const guest = useIsGuest();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        const loaded = {
          name: s.display_name ?? "",
          contacts: s.emergency_contacts ?? [],
          resources: s.crisis_resources ?? [],
          reminderEnabled: s.reminder_enabled === true,
          reminderTime: s.reminder_time ?? "20:00",
        };
        setName(loaded.name);
        setContacts(loaded.contacts);
        setResources(loaded.resources);
        setReminderEnabled(loaded.reminderEnabled);
        setReminderTime(loaded.reminderTime);
        setSaved(loaded);
      })
      .catch(() => setSaved({ name: "", contacts: [], resources: [], reminderEnabled: false, reminderTime: "20:00" }));
    setNotify("Notification" in window ? Notification.permission : "unsupported");
    browserClient()
      .auth.getSession()
      .then(({ data }) => {
        setEmail(data.session?.user.email ?? "");
        setProvider(data.session?.user.app_metadata?.provider ?? "");
      });
  }, []);

  // Highlight the section in view in the side menu.
  useEffect(() => {
    if (!saved) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-10% 0px -60% 0px" },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [saved]);

  const current: Saved = { name, contacts, resources, reminderEnabled, reminderTime };
  const dirty = !!saved && JSON.stringify(current) !== JSON.stringify(saved);

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: name,
        emergency_contacts: contacts,
        crisis_resources: resources,
        ...(!guest && { reminder_enabled: reminderEnabled, reminder_time: reminderTime }),
      }),
    }).catch(() => null);
    if (!res?.ok) return setStatus("failed");
    setSaved(current);
    setStatus("saved");
    setTimeout(() => setStatus((s) => (s === "saved" ? "" : s)), 2500);
    try {
      localStorage.removeItem("mind-settings"); // the chat re-reads the saved version
    } catch {}
    window.dispatchEvent(new Event("mind-settings-changed")); // the reminder picks up the new time
  }

  // Turning the reminder on asks the browser for permission to show notifications.
  async function toggleReminder(on: boolean) {
    setReminderEnabled(on);
    if (on && notify === "default") setNotify(await Notification.requestPermission());
  }

  async function lockRequest(body: object) {
    const res = await fetch("/api/lock/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res?.ok) return false;
    lockChanged({ ...(await res.json()), available: true });
    return true;
  }

  // Setting a PIN: choose it, then type it again.
  async function onPin(pin: string) {
    if (pinStep === "new") {
      setFirstPin(pin);
      setPinNote("");
      setPinStep("confirm");
      return;
    }
    if (pin !== firstPin) {
      setPinStep("new");
      setPinNote(t.pinMismatch);
      return t.pinMismatch;
    }
    if (!(await lockRequest({ pin, minutes: lock?.minutes ?? 5 }))) {
      setPinNote(t.pinFailed);
      return t.pinFailed;
    }
    setPinStep(null);
    setPinNote("");
  }

  function discard() {
    if (!saved) return;
    setName(saved.name);
    setContacts(saved.contacts);
    setResources(saved.resources);
    setReminderEnabled(saved.reminderEnabled);
    setReminderTime(saved.reminderTime);
    setStatus("");
  }

  async function signOut() {
    await browserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function deleteEverything() {
    setDeleteError("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) return setDeleteError(t.deleteFailed);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("mind-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    await signOut();
  }

  const shownName = name.trim() || email.split("@")[0] || (guest ? t.guestBadge : t.you);
  const signInMethod = guest ? t.guestBadge : t.via[provider] ?? t.via.email;

  return (
    <main className="min-h-dvh p-3 sm:p-6">
      <div className="glass animate-rise mx-auto w-full max-w-5xl rounded-[2.25rem] p-5 sm:p-8 xl:max-w-[1400px]">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/"
              aria-label={t.backHome}
              className="-ml-1 mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl tracking-tight sm:text-3xl">{t.title}</h1>
              <p className="text-sm text-[var(--muted)]">{t.subtitle}</p>
            </div>
          </div>
          <TopMenu current="/settings" />
        </header>

        <div className="mt-6 grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-10 xl:grid-cols-1">
          {/* Side menu on wide screens */}
          <nav aria-label={t.title} className="hidden lg:block xl:hidden">
            <ul className="sticky top-6 space-y-1">
              {SECTIONS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setActive(id)}
                    className={
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition " +
                      (active === id ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--fg)]/75 hover:bg-white/60")
                    }
                  >
                    <Icon id={id} className={id === "data" && active !== id ? "text-red-500/80" : ""} />
                    {t.nav[id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {!saved ? (
            <div className="space-y-4" aria-busy>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/50" />
              ))}
            </div>
          ) : (
            <div className="grid min-w-0 gap-8 xl:grid-cols-2 xl:items-start xl:gap-10">
              <div className="min-w-0 space-y-8 xl:space-y-6">
              <Section id="profile" title={t.nav.profile} hint={t.profileHint}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c4e6d6_45%,#9fc4e8)] text-xl font-medium text-[#2a4a3a]">
                    {shownName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg">{shownName}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{email || " "}</p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs text-[var(--muted)]">
                    {signInMethod}
                  </span>
                </div>
                <Row label={t.nameTitle} hint={t.nameHint}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    placeholder={t.namePlaceholder}
                    className={`${field} w-full sm:max-w-xs`}
                  />
                </Row>
              </Section>

              <Section id="preferences" title={t.nav.preferences} hint={t.preferencesHint}>
                <Row label={t.language} hint={t.languageHint}>
                  <LanguageSwitch />
                </Row>
                <Row
                  label={t.reminder}
                  hint={guest ? t.appLockGuest : reminderEnabled ? (notify === "granted" ? t.reminderOpenTab : t.reminderBlocked) : t.reminderHint}
                >
                  {guest ? (
                    <LockIcon size={16} className="text-[var(--muted)]" />
                  ) : (
                    <div className="flex items-center gap-3">
                      {reminderEnabled && (
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => e.target.value && setReminderTime(e.target.value)}
                          aria-label={t.reminder}
                          className="rounded-xl bg-[var(--bg)] px-3 py-1.5 text-base outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        />
                      )}
                      <Toggle on={reminderEnabled} onChange={toggleReminder} label={t.reminder} />
                    </div>
                  )}
                </Row>
              </Section>

              <Section id="data" title={t.nav.data} hint={t.dataHint} danger>
                <Row label={t.deleteTitle} hint={t.deleteHint(t.deleteWord)} stacked>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={t.deleteWord}
                      className={`${field} sm:max-w-xs`}
                    />
                    <button
                      onClick={deleteEverything}
                      disabled={confirmText.trim().toUpperCase() !== t.deleteWord}
                      className="rounded-xl bg-red-600 px-4 py-2 text-base text-white transition hover:bg-red-700 disabled:opacity-40"
                    >
                      {t.deleteButton}
                    </button>
                  </div>
                  {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
                </Row>
              </Section>
              </div>

              <div className="min-w-0 space-y-8 xl:space-y-6">
              <Section id="safety" title={t.nav.safety} hint={t.safetyHint}>
                <Row label={t.people} hint={t.peopleHint} stacked>
                  <ContactList bare items={contacts} onChange={setContacts} />
                </Row>
                <Row label={t.resources} hint={t.resourcesHint} stacked>
                  <ContactList bare items={resources} onChange={setResources} />
                </Row>
                <Row label={t.plan} hint={t.planHint}>
                  {guest ? (
                    <span className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                      <LockIcon size={14} />
                    </span>
                  ) : (
                    <Link
                      href="/safety-plan"
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                    >
                      {t.open} →
                    </Link>
                  )}
                </Row>
              </Section>


              <Section id="account" title={t.nav.account} hint={t.accountHint}>
                {guest ? (
                  <>
                    <Row label={t.guestTitle} hint={t.guestHint}>
                      <Link href={UPGRADE_PATH} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)]">
                        {t.create}
                      </Link>
                    </Row>
                    <Row label={t.leave} hint={confirmLeave ? t.leaveWarning : undefined}>
                      {confirmLeave ? (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmLeave(false)} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm">
                            {t.stay}
                          </button>
                          <button onClick={signOut} className="rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
                            {t.leaveAnyway}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmLeave(true)} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm hover:bg-[var(--accent-soft)]">
                          {t.leave}
                        </button>
                      )}
                    </Row>
                  </>
                ) : (
                  <>
                    <Row label={t.signedInAs} hint={email}>
                      <button onClick={signOut} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm hover:bg-[var(--accent-soft)]">
                        {t.signOut}
                      </button>
                    </Row>
                    {lock?.available && (
                      <Row label={t.appLock} hint={t.appLockHint}>
                        <div className="flex items-center gap-3">
                          {lock.enabled && (
                            <button
                              onClick={() => {
                                setPinNote("");
                                setPinStep("new");
                              }}
                              className="rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm hover:bg-[var(--accent-soft)]"
                            >
                              {t.changePin}
                            </button>
                          )}
                          <Toggle
                            on={lock.enabled}
                            label={t.appLock}
                            onChange={(on) => {
                              if (on) {
                                setPinNote("");
                                setPinStep("new");
                              } else lockRequest({ enabled: false });
                            }}
                          />
                        </div>
                      </Row>
                    )}
                    {lock?.enabled && (
                      <Row label={t.lockAfter} hint={t.lockAfterHint}>
                        <select
                          value={lock.minutes}
                          onChange={(e) => lockRequest({ minutes: Number(e.target.value) })}
                          className="rounded-xl bg-[var(--bg)] px-3 py-1.5 text-base outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          {LOCK_MINUTES.map((m) => (
                            <option key={m} value={m}>
                              {t.minutes(m)}
                            </option>
                          ))}
                        </select>
                      </Row>
                    )}
                  </>
                )}
              </Section>
              </div>
            </div>
          )}
        </div>
      </div>

      {pinStep && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#1d2a20]/30 p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label={t.appLock}>
          <div className="glass animate-rise w-full max-w-sm rounded-[2rem] px-6 py-7 text-center">
            <h2 className="text-xl tracking-tight">{pinStep === "new" ? t.pinNew : t.pinConfirm}</h2>
            <p className="mt-1 min-h-5 text-sm text-[var(--muted)]">{pinNote || (pinStep === "new" ? t.pinNewHint : "")}</p>
            <div className="mt-4">
              <PinPad key={pinStep} onComplete={onPin} />
            </div>
            <button
              onClick={() => setPinStep(null)}
              className="mt-5 rounded-full px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Save bar: only when something changed (or right after saving). */}
      {(dirty || status === "saved" || status === "failed") && (
        <div className="animate-rise fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(20,50,30,0.5)] backdrop-blur-xl">
          <span className="min-w-0 truncate text-sm">
            {status === "saved" ? `✓ ${t.saved}` : status === "failed" ? t.saveFailed : t.unsaved}
          </span>
          {dirty && (
            <div className="flex shrink-0 gap-2">
              <button onClick={discard} className="rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]">
                {t.discard}
              </button>
              <button
                onClick={save}
                disabled={status === "saving"}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
              >
                {status === "saving" ? t.saving : t.save}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
