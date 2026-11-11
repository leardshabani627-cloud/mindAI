"use client";

import Link from "next/link";
import LockIcon from "@/components/LockIcon";
import TopMenu from "@/components/TopMenu";
import { UPGRADE_PATH } from "@/lib/guest";
import { useCopy } from "@/lib/i18n";

// Everything a guest sees about what needs a free account: locks are shown, never hidden,
// so it's clear what Mind can do and that nothing is being saved behind their back.

type Feature = "journal" | "insights" | "memory" | "letters" | "safetyPlan";

const en = {
  create: "Create a free account",
  free: "Free · your chats and settings come with you",
  backHome: "Back to home",
  locked: "Needs a free account",
  bannerTitle: "You're visiting as a guest",
  bannerText: "Mind won't remember you between chats. Journal, mood, memories and letters need a free account.",
  bannerChat: "Guest chat: not remembered, and limited each day.",
  features: {
    journal: { title: "Your journal", text: "A private journal needs an account, so your pages are kept safe and only you can open them." },
    insights: { title: "Insights", text: "Insights look at your mood over days and weeks. With an account, each check-in is kept so patterns can show." },
    memory: { title: "Memory", text: "As a guest, Mind doesn't remember past conversations. With an account, it keeps short notes of what matters to you." },
    letters: { title: "Weekly letters", text: "Each week your companion writes you a short letter about the week. That needs an account to remember the week." },
    safetyPlan: { title: "My safety plan", text: "A safety plan is kept for the hard moments, so it needs an account to be saved. If you're in danger now, call your local emergency number or someone you trust." },
  } satisfies Record<Feature, { title: string; text: string }>,
};
const COPY = {
  en,
  sq: {
    create: "Krijo një llogari falas",
    free: "Falas · bisedat dhe cilësimet vijnë me ty",
    backHome: "Kthehu në ballinë",
    locked: "Kërkon llogari falas",
    bannerTitle: "Je këtu si mysafir",
    bannerText: "Mind nuk të mban mend nga një bisedë në tjetrën. Ditari, gjendja, kujtesa dhe letrat kërkojnë llogari falas.",
    bannerChat: "Bisedë si mysafir: nuk mbahet mend dhe është e kufizuar çdo ditë.",
    features: {
      journal: { title: "Ditari yt", text: "Ditari privat kërkon llogari, që faqet e tua të ruhen të sigurta dhe t'i hapësh vetëm ti." },
      insights: { title: "Pasqyra", text: "Pasqyra shikon gjendjen tënde nëpër ditë e javë. Me llogari, çdo regjistrim ruhet që të duken modelet." },
      memory: { title: "Kujtesa", text: "Si mysafir, Mind nuk i mban mend bisedat e kaluara. Me llogari, ruan shënime të shkurtra për atë që ka rëndësi për ty." },
      letters: { title: "Letrat e javës", text: "Çdo javë shoqëruesi yt të shkruan një letër të shkurtër për javën. Për këtë duhet llogari që java të mbahet mend." },
      safetyPlan: { title: "Plani im i sigurisë", text: "Plani i sigurisë ruhet për momentet e vështira, ndaj kërkon llogari. Nëse je në rrezik tani, telefono numrin lokal të urgjencës ose dikë që i beson." },
    },
  } satisfies typeof en,
};

const ctaClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)]";

/** A whole page a guest can't use yet, with what it does and the way in. */
export function GuestLock({ feature }: { feature: Feature }) {
  const t = useCopy(COPY);
  const f = t.features[feature];

  return (
    <main className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="glass animate-rise flex w-full max-w-xl flex-col rounded-[2.25rem] p-5 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <Link
            href="/"
            aria-label={t.backHome}
            className="-ml-1 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-soft)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </Link>
          <TopMenu />
        </header>

        <div className="flex flex-col items-center px-2 py-10 text-center sm:px-6">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <LockIcon size={26} />
          </span>
          <h1 className="mt-5 text-2xl tracking-tight">{f.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.locked}</p>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--fg)]/85">{f.text}</p>
          <Link href={UPGRADE_PATH} className={`${ctaClass} mt-7`}>
            {t.create}
          </Link>
          <p className="mt-2 text-xs text-[var(--muted)]">{t.free}</p>
          <Link href="/" className="mt-6 text-sm text-[var(--muted)] underline-offset-2 hover:underline">
            {t.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}

/** Shows a home card dimmed, with a lock and the way in, when `locked`. */
export function GuestCover({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  const t = useCopy(COPY);
  if (!locked) return <>{children}</>;

  return (
    <div className="relative h-full">
      <div inert className="h-full opacity-55 blur-[1.5px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <span className="flex items-center gap-1.5 rounded-full bg-[var(--card-solid)] px-3 py-1 text-sm text-[var(--fg)] shadow-sm">
          <LockIcon />
          {t.locked}
        </span>
        <Link href={UPGRADE_PATH} className={ctaClass}>
          {t.create}
        </Link>
      </div>
    </div>
  );
}

/** A quiet note that this is a guest visit, with the way to keep things. */
export function GuestBanner({ variant = "home" }: { variant?: "home" | "chat" }) {
  const t = useCopy(COPY);

  if (variant === "chat") {
    return (
      <div className="relative mx-5 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/15 px-3.5 py-2 text-sm sm:mx-7">
        <span className="min-w-0 text-white/90">{t.bannerChat}</span>
        <Link href={UPGRADE_PATH} className="shrink-0 rounded-full bg-white px-3 py-1 text-[var(--voice-from)] hover:bg-white/90">
          {t.create}
        </Link>
      </div>
    );
  }

  return (
    <div className="glass mt-5 flex flex-col gap-3 rounded-[1.5rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <LockIcon size={16} />
        </span>
        <div>
          <p className="text-base">{t.bannerTitle}</p>
          <p className="text-sm text-[var(--muted)]">{t.bannerText}</p>
        </div>
      </div>
      <Link href={UPGRADE_PATH} className={`${ctaClass} shrink-0`}>
        {t.create}
      </Link>
    </div>
  );
}
