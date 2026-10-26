"use client";

import { useEffect, useState } from "react";
import Disclaimer from "@/components/Disclaimer";
import MemoriesCard from "@/components/home/MemoriesCard";
import MoodCard from "@/components/home/MoodCard";
import NavBar from "@/components/home/NavBar";
import CompanionCard from "@/components/home/CompanionCard";
import VoiceCard from "@/components/home/VoiceCard";
import WeekCard from "@/components/home/WeekCard";
import type { MoodEntry } from "@/components/home/week";
import type { Settings } from "@/lib/settings";
import { browserClient } from "@/lib/supabase/browser";
import { COMPANION_KEY, DEFAULT_COMPANION, getCompanion, type Companion } from "@/prompts/companions";

type Summary = { id: string; summary: string; themes: string[]; created_at: string };

// The first screen: a calm overview that fills the window, with the conversation one tap away.
export default function Home() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);
  const [email, setEmail] = useState("");
  const [companion, setCompanion] = useState<Companion>(DEFAULT_COMPANION);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([get("/api/mood"), get("/api/memory"), get("/api/settings")]).then(([mood, memory, s]) => {
      setEntries(mood?.entries ?? []);
      setSummaries(memory?.summaries ?? []);
      setSettings(s);
      setLoaded(true);
    });
    browserClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
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
      return setSaveStatus("That conversation is still too short to remember. Talk a little more first.");
    }
    if (result !== "saved" && result !== "already-saved") {
      return setSaveStatus("Couldn't save it right now. Please try again in a minute.");
    }
    // Start a fresh conversation next time, like "End & start new".
    try {
      localStorage.setItem("mind-session", crypto.randomUUID());
      localStorage.setItem("mind-chat", "[]");
    } catch {}
    setHasConversation(false);
    setSaveStatus("Saved. Mind will remember this conversation.");
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
        <NavBar email={email} />

        <div className="mt-6 grid flex-1 gap-5 lg:grid-cols-[1.12fr_1fr_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-6 lg:[grid-template-areas:'greet_mood_people'_'voice_week_people'_'voice_mem_mem']">
          <div className="flex flex-col justify-end pb-2 lg:[grid-area:greet]">
            <div className="animate-float mb-4 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c4e6d6_40%,#9fc4e8_80%)] shadow-[0_18px_40px_-12px_rgba(90,140,150,0.6)] 2xl:h-20 2xl:w-20" />
            <h1 className="text-[clamp(2.25rem,3vw,4rem)] leading-[1.1] font-normal tracking-tight">
              Don&apos;t worry <span aria-hidden>👋</span>
              <br />
              <span className="text-[var(--muted)]">Mind is listening…</span>
            </h1>
            <p className="mt-3 text-base text-[var(--muted)]">Mos u shqetëso, Mind po të dëgjon.</p>
          </div>

          <div className="lg:[grid-area:voice]">
            <VoiceCard
              hasConversation={hasConversation}
              monthCount={summaries.filter((s) => s.created_at.slice(0, 7) === new Date().toISOString().slice(0, 7)).length}
            />
          </div>

          <div className="lg:[grid-area:mood]">
            <MoodCard entries={entries} loaded={loaded} onSaved={(e) => setEntries((prev) => [...prev, e])} />
          </div>

          <div className="lg:[grid-area:week]">
            <WeekCard entries={entries} loaded={loaded} />
          </div>

          <div className="lg:[grid-area:mem]">
            <MemoriesCard
              summaries={summaries}
              loaded={loaded}
              hasConversation={hasConversation}
              saving={saving}
              status={saveStatus}
              onSaveNow={saveConversation}
            />
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
