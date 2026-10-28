"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Disclaimer from "@/components/Disclaimer";
import { GuestBanner, GuestCover } from "@/components/Guest";
import MemoriesCard from "@/components/home/MemoriesCard";
import MoodCard from "@/components/home/MoodCard";
import NavBar from "@/components/home/NavBar";
import CompanionCard from "@/components/home/CompanionCard";
import LetterPill from "@/components/home/LetterPill";
import VoiceCard from "@/components/home/VoiceCard";
import WeekCard from "@/components/home/WeekCard";
import type { MoodEntry } from "@/components/home/week";
import type { Settings } from "@/lib/settings";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { COMPANION_KEY, DEFAULT_COMPANION, getCompanion, type Companion } from "@/prompts/companions";

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

const en = {
  greeting: "Don't worry",
  listening: "Mind is listening…",
  subtitle: "A calm, private space to talk.",
  breathe: "Need a moment? Breathe with me · 2 min",
  tooShort: "That conversation is still too short to remember. Talk a little more first.",
  saveFailed: "Couldn't save it right now. Please try again in a minute.",
  saved: "Saved. Mind will remember this conversation.",
};
const COPY = {
  en,
  sq: {
    greeting: "Mos u shqetëso",
    listening: "Mind po të dëgjon…",
    subtitle: "Një hapësirë e qetë dhe private për të folur.",
    breathe: "Të duhet një moment? Merr frymë me mua · 2 min",
    tooShort: "Kjo bisedë është ende shumë e shkurtër për t'u mbajtur mend. Fol edhe pak.",
    saveFailed: "Nuk u ruajt tani. Provo përsëri pas një minute.",
    saved: "U ruajt. Mind do ta mbajë mend këtë bisedë.",
  } satisfies typeof en,
};

// The first screen: a calm overview that fills the window, with the conversation one tap away.
export default function Home() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);
  const [email, setEmail] = useState("");
  const [guest, setGuest] = useState(false);
  const [companion, setCompanion] = useState<Companion>(DEFAULT_COMPANION);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    browserClient()
      .auth.getSession()
      .then(async ({ data }) => {
        const user = data.session?.user;
        const isGuest = user?.is_anonymous === true;
        setEmail(user?.email ?? "");
        setGuest(isGuest);
        // Guests have no mood entries or memories to load: those need an account.
        return Promise.all([isGuest ? null : get("/api/mood"), isGuest ? null : get("/api/memory"), get("/api/settings")]);
      })
      .then(([mood, memory, s]) => {
      // New here: the welcome steps come first.
      // Only when the server clearly says so (null), never because the field is missing.
      if (s && s.onboarded_at === null) return router.replace("/welcome");
      setEntries(mood?.entries ?? []);
      setSummaries(memory?.summaries ?? []);
      setSettings(s);
      setLoaded(true);
    });
    try {
      setCompanion(getCompanion(localStorage.getItem(COMPANION_KEY)));
      setHasConversation(JSON.parse(localStorage.getItem("mind-chat") ?? "[]").length > 0);
    } catch {}
  }, []);

  // End the open conversation now and turn it into a memory (same as "End & start new" in the chat).
  async function saveConversation() {
    const sessionId = localStorage.getItem("mind-session");
    if (!sessionId) return;
    setSaving(true);
    setSaveStatus("");
    const res = await fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => null);
    const result = res ? (await res.json().catch(() => ({}))).result : "failed";
    setSaving(false);

    if (result === "too-short") {
      return setSaveStatus(t.tooShort);
    }
    if (result !== "saved" && result !== "already-saved") {
      return setSaveStatus(t.saveFailed);
    }
    // Start a fresh conversation next time, like "End & start new".
    try {
      localStorage.setItem("mind-session", crypto.randomUUID());
      localStorage.setItem("mind-chat", "[]");
    } catch {}
    setHasConversation(false);
    setSaveStatus(t.saved);
    const memory = await fetch("/api/memory").then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (memory) setSummaries(memory.summaries);
  }

  function chooseCompanion(c: Companion) {
    setCompanion(c);
    try {
      localStorage.setItem(COMPANION_KEY, c.id);
    } catch {}
  }

  async function acceptDisclaimer() {
    setSettings((s) => s && { ...s, disclaimer_accepted_at: new Date().toISOString() });
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptDisclaimer: true }),
    }).catch(() => {});
  }

  return (
    <main className="flex min-h-dvh p-3 sm:p-4">
      {/* The white-edged frame fills the whole window */}
      <div className="mx-auto flex w-full max-w-[1720px] flex-col rounded-[2.5rem] border-2 border-[var(--glass-border)] p-4 sm:p-6 2xl:p-8">
        <NavBar email={email} name={settings?.display_name ?? null} guest={guest} />
        {guest && <GuestBanner />}

        <div className="mt-6 grid flex-1 gap-5 lg:grid-cols-[1.12fr_1fr_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-6 lg:[grid-template-areas:'greet_mood_people'_'voice_week_people'_'voice_mem_mem']">
          <div className="flex flex-col justify-end pb-2 lg:[grid-area:greet]">
            <div className="animate-float mb-4 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c4e6d6_40%,#9fc4e8_80%)] shadow-[0_18px_40px_-12px_rgba(90,140,150,0.6)] 2xl:h-20 2xl:w-20" />
            <h1 className="text-[clamp(2.25rem,3vw,4rem)] leading-[1.1] font-normal tracking-tight">
              {t.greeting} <span aria-hidden>👋</span>
              <br />
              <span className="text-[var(--muted)]">{t.listening}</span>
            </h1>
            <p className="mt-3 text-base text-[var(--muted)]">{t.subtitle}</p>
            <Link
              href="/calm"
              className="glass mt-5 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:-translate-y-0.5"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" />
                </svg>
              </span>
              {t.breathe}
            </Link>
            {loaded && !guest && <LetterPill companionId={companion.id} companionName={companion.name} />}
          </div>

          <div className="lg:[grid-area:voice]">
            <VoiceCard
              hasConversation={hasConversation}
              monthCount={summaries.filter((s) => s.created_at.slice(0, 7) === new Date().toISOString().slice(0, 7)).length}
            />
          </div>

          <div className="lg:[grid-area:mood]">
            <GuestCover locked={guest}>
              <MoodCard entries={entries} loaded={loaded} onSaved={(e) => setEntries((prev) => [...prev, e])} />
            </GuestCover>
          </div>

          <div className="lg:[grid-area:week]">
            <GuestCover locked={guest}>
              <WeekCard entries={entries} loaded={loaded} />
            </GuestCover>
          </div>

          <div className="lg:[grid-area:mem]">
            <GuestCover locked={guest}>
              <MemoriesCard
                summaries={summaries}
                loaded={loaded}
                hasConversation={hasConversation}
                saving={saving}
                status={saveStatus}
                onSaveNow={saveConversation}
              />
            </GuestCover>
          </div>

          <div className="lg:[grid-area:people]">
            <CompanionCard
              companion={companion}
              onChange={chooseCompanion}
              contacts={[...(settings?.emergency_contacts ?? []), ...(settings?.crisis_resources ?? [])]}
            />
          </div>
        </div>
      </div>

      {loaded && settings && !settings.disclaimer_accepted_at && <Disclaimer onAccept={acceptDisclaimer} />}
    </main>
  );
}
