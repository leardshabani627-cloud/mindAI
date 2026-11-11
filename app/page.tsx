"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Disclaimer from "@/components/Disclaimer";
import { GuestBanner, GuestCover } from "@/components/Guest";
import Greeting from "@/components/home/Greeting";
import MemoriesCard from "@/components/home/MemoriesCard";
import NavBar from "@/components/home/NavBar";
import TalkCard from "@/components/home/TalkCard";
import TodayCard from "@/components/home/TodayCard";
import type { MoodEntry } from "@/components/home/week";
import type { Settings } from "@/lib/settings";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { COMPANION_KEY, DEFAULT_COMPANION, getCompanion, type Companion } from "@/prompts/companions";

type Summary = { id: string; summary: string; summary_you?: string | null; themes: string[]; created_at: string };

const en = {
  tooShort: "That conversation is still too short to remember. Talk a little more first.",
  saveFailed: "Couldn't save it right now. Please try again in a minute.",
  saved: "Saved. Mind will remember this conversation.",
};
const COPY = {
  en,
  sq: {
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

  // What I like to be called (set in Settings). An email username isn't a greeting, so no name then.
  const name = settings?.display_name || null;

  return (
    <main className="flex min-h-dvh items-start p-3 sm:p-4">
      {/* The white-edged frame is as tall as what's in it, with the meadow below */}
      <div className="mx-auto flex w-full max-w-[1720px] flex-col rounded-[2.5rem] border-2 border-[var(--glass-border)] p-4 sm:p-6 2xl:p-8">
        <NavBar email={email} name={settings?.display_name ?? null} guest={guest} />
        {guest && <GuestBanner />}

        <Greeting name={name} entries={entries} guest={guest} companionId={companion.id} companionName={companion.name} />

        {/* Three cards side by side, all the same height: talk, today, memories */}
        <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <TalkCard
            companion={companion}
            onChange={chooseCompanion}
            contacts={[...(settings?.emergency_contacts ?? []), ...(settings?.crisis_resources ?? [])]}
          />

          <GuestCover locked={guest}>
            <TodayCard
              entries={entries}
              loaded={loaded}
              onSaved={(e) => setEntries((prev) => [...prev.filter((x) => x.entry_date !== e.entry_date), e])}
            />
          </GuestCover>

          <div className="min-w-0 lg:col-span-2 xl:col-span-1">
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
        </div>
      </div>

      {loaded && settings && !settings.disclaimer_accepted_at && <Disclaimer onAccept={acceptDisclaimer} />}
    </main>
  );
}
