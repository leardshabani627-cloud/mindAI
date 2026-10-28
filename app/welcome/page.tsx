"use client";

import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { authField } from "@/components/AuthShell";
import Portrait from "@/components/Portrait";
import { COMPANION_KEY, COMPANIONS, DEFAULT_COMPANION, companionText } from "@/prompts/companions";
import LanguageSwitch from "@/components/LanguageSwitch";
import LockIcon from "@/components/LockIcon";
import { useCopy, useLang } from "@/lib/i18n";

const en = {
  step: (n: number, of: number) => `Step ${n} of ${of}`,
  welcome: "Welcome to Mind",
  welcomeText: "A calm, private space to talk.",
  nameLabel: "What should Mind call you? (optional)",
  namePlaceholder: "Your first name or a nickname",
  disclaimer: "I'm an AI companion, not a replacement for a therapist or the people in your life.",
  chooseTitle: "Who would you like to talk with?",
  chooseText: "Each one is an AI companion with their own way of talking. You can change anytime.",
  trustTitle: "One person you trust",
  trustText: "Someone you could call on a hard day. Mind will keep them one tap away. You can skip this.",
  trustName: "Name (e.g. my sister Ana)",
  trustPhone: "Phone number",
  trustLater: "Later, in your safety plan, you can add more people and crisis lines for where you live.",
  allSet: (name: string) => (name ? `You're all set, ${name}` : "You're all set"),
  tourIntro: "A few things you can do in Mind:",
  tour: (companion: string): [string, string, string][] => [
    ["💬", `Talk with ${companion}`, "Type or speak, in English or shqip."],
    ["🌤️", "Check in each day", "A quick mood check that shows patterns over time."],
    ["🌿", "Calm down in 2 minutes", "Guided breathing whenever it gets too much."],
    ["📓", "Write in your journal", "Private writing, never sent to the AI."],
    ["🛟", "Make a safety plan", "Your own steps and people for a hard moment."],
  ],
  back: "Back",
  skip: "Skip for now",
  continue: "Continue",
  gettingReady: "Getting ready…",
  start: "Start",
  saveFailed: "Couldn't save. Please try again.",
  adult: "I'm 16 or older.",
  guestNote: "As a guest you can talk and use the calm tools. The ones with a lock need a free account, whenever you like.",
};
const COPY = {
  en,
  sq: {
    step: (n: number, of: number) => `Hapi ${n} nga ${of}`,
    welcome: "Mirë se erdhe në Mind",
    welcomeText: "Një hapësirë e qetë dhe private për të folur.",
    nameLabel: "Si do të të thërrasë Mind? (opsionale)",
    namePlaceholder: "Emri yt ose një nofkë",
    disclaimer: "Jam një shoqërues AI, jo zëvendësues i një terapisti apo i njerëzve në jetën tënde.",
    chooseTitle: "Me kë do të doje të flasësh?",
    chooseText: "Secili është një shoqërues AI me mënyrën e vet të të folurit. Mund ta ndryshosh kurdo.",
    trustTitle: "Një person që i beson",
    trustText: "Dikush që mund ta telefonosh në një ditë të vështirë. Mind do ta mbajë një prekje larg. Mund ta kalosh këtë hap.",
    trustName: "Emri (p.sh. motra ime Ana)",
    trustPhone: "Numri i telefonit",
    trustLater: "Më vonë, në planin e sigurisë, mund të shtosh më shumë njerëz dhe linja krize ku jeton.",
    allSet: (name: string) => (name ? `Gati je, ${name}` : "Gati je"),
    tourIntro: "Disa gjëra që mund të bësh në Mind:",
    tour: (companion: string): [string, string, string][] => [
      ["💬", `Fol me ${companion}`, "Shkruaj ose fol, shqip ose anglisht."],
      ["🌤️", "Kontrollo gjendjen çdo ditë", "Një kontroll i shpejtë që tregon modelet me kohë."],
      ["🌿", "Qetësohu në 2 minuta", "Frymëmarrje e udhëhequr kur bëhet tepër."],
      ["📓", "Shkruaj në ditar", "Shkrim privat, nuk i dërgohet kurrë AI-së."],
      ["🛟", "Bëj një plan sigurie", "Hapat dhe njerëzit e tu për një moment të vështirë."],
    ],
    back: "Prapa",
    skip: "Kaloje tani",
    continue: "Vazhdo",
    gettingReady: "Po përgatitet…",
    start: "Fillo",
    saveFailed: "Nuk u ruajt. Provo përsëri.",
    adult: "Jam 16 vjeç ose më i madh.",
    guestNote: "Si mysafir mund të flasësh dhe të përdorësh mjetet e qetësimit. Ato me dry kërkojnë llogari falas, kur të duash.",
  } satisfies typeof en,
};

const STEPS = 4;
// Tour items a guest can't use yet: the daily check-in, the journal and the safety plan.
const ACCOUNT_ONLY_TOUR = [1, 3, 4];

// First run, right after signing up: your name, your companion, one person you trust, and a short tour.
export default function WelcomePage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [companionId, setCompanionId] = useState(DEFAULT_COMPANION.id);
  const [contact, setContact] = useState({ name: "", detail: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Email sign-ups already confirmed their age; people who joined with Google confirm it here.
  const [needsAge, setNeedsAge] = useState(false);
  const [adult, setAdult] = useState(false);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    browserClient()
      .auth.getUser()
      .then(({ data }) => {
        setNeedsAge(!!data.user && data.user.app_metadata?.provider !== "email");
        setGuest(data.user?.is_anonymous === true);
      });
  }, []);

  const companion = COMPANIONS.find((c) => c.id === companionId) ?? DEFAULT_COMPANION;

  async function finish() {
    setBusy(true);
    setError("");
    try {
      localStorage.setItem(COMPANION_KEY, companionId);
    } catch {}
    const hasContact = contact.name.trim() || contact.detail.trim();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: name,
        acceptDisclaimer: true,
        finishOnboarding: true,
        ...(hasContact ? { emergency_contacts: [contact] } : {}),
      }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(t.saveFailed);
    router.replace("/");
    router.refresh();
  }

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="glass animate-rise w-full max-w-lg rounded-[2rem] p-6 sm:p-9">
        <div className="mb-6 flex justify-center gap-1.5" aria-label={t.step(step + 1, STEPS)}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={"h-1.5 rounded-full transition-all " + (i === step ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-[var(--check)]")} />
          ))}
        </div>

        {step === 0 && (
          <section>
            <div className="animate-float mx-auto mb-5 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c4e6d6_40%,#9fc4e8_80%)] shadow-[0_14px_30px_-12px_rgba(90,140,150,0.6)]" />
            <div className="mb-4 flex justify-center">
              <LanguageSwitch />
            </div>
            <h1 className="text-center text-3xl tracking-tight">{t.welcome}</h1>
            <p className="mt-1 text-center text-[var(--muted)]">{t.welcomeText}</p>
            <label className="mt-6 block text-sm text-[var(--muted)]" htmlFor="name">
              {t.nameLabel}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="given-name"
              placeholder={t.namePlaceholder}
              className={`${authField} mt-1.5`}
            />
            <p className="mt-5 rounded-2xl bg-[var(--accent-soft)]/70 px-4 py-3 text-sm">
              {t.disclaimer}
            </p>
            {needsAge && (
              <label className="mt-4 flex items-center gap-3 text-sm">
                <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="accent-[var(--accent)]" />
                {t.adult}
              </label>
            )}
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="text-center text-2xl tracking-tight">{t.chooseTitle}</h1>
            <p className="mt-1 text-center text-[var(--muted)]">{t.chooseText}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCompanionId(c.id)}
                  aria-pressed={c.id === companionId}
                  className={
                    "flex flex-col items-center rounded-2xl border-2 px-3 py-4 text-center transition " +
                    (c.id === companionId ? "border-[var(--accent)] bg-[var(--accent-soft)]/60" : "border-transparent bg-[var(--card-solid)] hover:border-[var(--line)]")
                  }
                >
                  <span
                    className="grid h-16 w-16 place-items-end overflow-hidden rounded-full"
                    style={{ background: `linear-gradient(160deg, ${c.look.bg[0]}, ${c.look.bg[1]})` }}
                  >
                    <Portrait companion={c} variant="round" />
                  </span>
                  <span className="mt-2 text-base">{c.name}</span>
                  <span className="text-xs text-[var(--muted)]">{companionText(c, lang).title}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">{companionText(companion, lang).about}</p>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-center text-2xl tracking-tight">{t.trustTitle}</h1>
            <p className="mt-1 text-center text-[var(--muted)]">
              {t.trustText}
            </p>
            <div className="mt-6 space-y-3">
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                maxLength={80}
                placeholder={t.trustName}
                className={authField}
              />
              <input
                value={contact.detail}
                onChange={(e) => setContact({ ...contact, detail: e.target.value })}
                maxLength={120}
                inputMode="tel"
                placeholder={t.trustPhone}
                className={authField}
              />
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              {t.trustLater}
            </p>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-center text-2xl tracking-tight">{t.allSet(name.trim())}</h1>
            <p className="mt-1 text-center text-[var(--muted)]">{t.tourIntro}</p>
            <ul className="mt-6 space-y-3">
              {t.tour(companion.name).map(([icon, title, text], i) => (
                <li key={title} className="flex gap-3 rounded-2xl bg-[var(--card-solid)] px-4 py-3">
                  <span aria-hidden className="text-xl">{icon}</span>
                  <span className="flex-1">
                    <span className="block">{title}</span>
                    <span className="block text-sm text-[var(--muted)]">{text}</span>
                  </span>
                  {guest && ACCOUNT_ONLY_TOUR.includes(i) && <LockIcon size={15} className="mt-1 shrink-0 text-[var(--muted)]" />}
                </li>
              ))}
            </ul>
            {guest && <p className="mt-4 text-center text-sm text-[var(--muted)]">{t.guestNote}</p>}
          </section>
        )}

        {error && <p className="mt-4 text-center text-sm text-[var(--muted)]">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button onClick={back} className="rounded-full px-4 py-2 text-[var(--muted)] hover:text-[var(--fg)]">
              {t.back}
            </button>
          ) : (
            <span />
          )}
          {step < STEPS - 1 ? (
            <button
              onClick={next}
              disabled={step === 0 && needsAge && !adult}
              className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-[var(--on-accent)] disabled:opacity-40"
            >
              {step === 2 && !contact.name.trim() && !contact.detail.trim() ? t.skip : t.continue}
            </button>
          ) : (
            <button onClick={finish} disabled={busy} className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-[var(--on-accent)] disabled:opacity-50">
              {busy ? t.gettingReady : t.start}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
