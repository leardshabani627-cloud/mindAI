"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Portrait from "@/components/Portrait";
import { useCopy, useLang } from "@/lib/i18n";
import { setStartLive, setStartText, setStartVoice } from "@/lib/pending";
import { telHref } from "@/lib/phone";
import { COMPANIONS, companionText, type Companion } from "@/prompts/companions";

const en = {
  ai: "AI companion",
  previous: "Previous companion",
  next: "Next companion",
  continueTitle: "Continue where you left off",
  openChat: "Open chat →",
  startTitle: (name: string) => `${name} is here when you're ready`,
  placeholder: (name: string) => `What's on your mind? Write to ${name}…`,
  speak: "Speak instead of typing",
  live: "Live",
  liveHint: "Talk hands-free, like a call",
  send: "Send",
  call: (who: string) => `Call ${who}`,
  addPeople: "Add someone you trust →",
  trusted: "Someone you trust",
};
const COPY = {
  en,
  sq: {
    ai: "Shoqërues AI",
    previous: "Shoqëruesi i mëparshëm",
    next: "Shoqëruesi tjetër",
    continueTitle: "Vazhdo aty ku mbete",
    openChat: "Hap bisedën →",
    startTitle: (name: string) => `${name} është këtu kur të jesh gati`,
    placeholder: (name: string) => `Çka ke në mendje? Shkruaji ${name}…`,
    speak: "Fol në vend që të shkruash",
    live: "Live",
    liveHint: "Fol pa duar, si në telefon",
    send: "Dërgo",
    call: (who: string) => `Telefono ${who}`,
    addPeople: "Shto dikë që i beson →",
    trusted: "Dikush që i beson",
  } satisfies typeof en,
};

type Contact = { name: string; detail: string };

/** The last thing the companion said in the open conversation (kept on this device), if any. */
function lastReply() {
  try {
    const messages = JSON.parse(localStorage.getItem("mind-chat") ?? "[]") as { role: string; content: string }[];
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    return last ? last.content.replace(/\s+/g, " ").trim() : "";
  } catch {
    return "";
  }
}

// The way in: who you talk with, where you left off, and a box to start talking (typed, spoken or live).
export default function TalkCard({ companion, onChange, contacts }: {
  companion: Companion;
  onChange: (c: Companion) => void;
  contacts: Contact[];
}) {
  const router = useRouter();
  const t = useCopy(COPY);
  const { lang } = useLang();
  const text = companionText(companion, lang);
  const [draft, setDraft] = useState("");
  const [previous, setPrevious] = useState("");

  useEffect(() => setPrevious(lastReply()), []);

  const index = COMPANIONS.findIndex((c) => c.id === companion.id);
  const step = (by: number) => onChange(COMPANIONS[(index + by + COMPANIONS.length) % COMPANIONS.length]);
  const first = contacts[0];
  const call = first && telHref(first.detail);

  function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft.trim()) return router.push("/chat");
    setStartText(draft);
    router.push("/chat");
  }

  return (
    <section className="glass flex h-full flex-col rounded-[2rem] p-5 sm:p-6">
      {/* Who you talk with */}
      <div className="flex items-center gap-4">
        <span
          className="grid h-16 w-16 shrink-0 place-items-end overflow-hidden rounded-full ring-4 ring-white"
          style={{ background: `linear-gradient(160deg, ${companion.look.bg[0]}, ${companion.look.bg[1]})` }}
        >
          <Portrait key={companion.id} companion={companion} variant="round" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl leading-tight tracking-tight">{companion.name}</h2>
          <p className="truncate text-sm text-[var(--muted)]">
            {text.title} · {t.ai}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {[
            [-1, t.previous, "m15 6-6 6 6 6"],
            [1, t.next, "m9 6 6 6-6 6"],
          ].map(([by, label, d]) => (
            <button
              key={label as string}
              onClick={() => step(by as number)}
              aria-label={label as string}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--muted)] hover:bg-white hover:text-[var(--fg)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d={d as string} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 pl-20" aria-hidden>
        {COMPANIONS.map((c) => (
          <span key={c.id} className={"h-1.5 rounded-full transition-all " + (c.id === companion.id ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--check)]")} />
        ))}
      </div>

      {/* Where you left off */}
      <div className="mt-5 rounded-2xl bg-[var(--accent-soft)]/60 px-4 py-3">
        {previous ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-[var(--accent-strong)] uppercase">{t.continueTitle}</p>
              <Link href="/chat" className="shrink-0 text-sm text-[var(--accent-strong)] hover:underline">
                {t.openChat}
              </Link>
            </div>
            <p className="mt-1 line-clamp-2 text-[15px] text-[var(--fg)]/85">“{previous}”</p>
          </>
        ) : (
          <>
            <p className="text-[15px]">{t.startTitle(companion.name)}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{text.about}</p>
          </>
        )}
      </div>

      {/* Start talking */}
      <form onSubmit={send} className="mt-4 flex flex-1 flex-col rounded-2xl border border-[var(--line)] bg-white/90 p-3 shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent)]/40">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send(e);
          }}
          rows={2}
          maxLength={4000}
          placeholder={t.placeholder(companion.name)}
          className="min-h-[3.5rem] w-full flex-1 resize-none bg-transparent px-1 text-base outline-none placeholder:text-[var(--muted)]"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStartVoice();
              router.push("/chat");
            }}
            aria-label={t.speak}
            title={t.speak}
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setStartLive();
              router.push("/chat");
            }}
            title={t.liveHint}
            className="flex h-10 items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 text-sm text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            {t.live}
          </button>
          <button
            type="submit"
            aria-label={t.send}
            className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Someone real, one tap away */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
        <span className="text-[var(--muted)]">{t.trusted}</span>
        {first ? (
          call ? (
            <a href={call} className="truncate text-[var(--accent-strong)] hover:underline">
              📞 {t.call(first.name || first.detail)}
            </a>
          ) : (
            <Link href="/settings" className="truncate text-[var(--accent-strong)] hover:underline">
              {first.name}: {first.detail}
            </Link>
          )
        ) : (
          <Link href="/settings" className="text-[var(--accent-strong)] hover:underline">
            {t.addPeople}
          </Link>
        )}
      </div>
    </section>
  );
}
