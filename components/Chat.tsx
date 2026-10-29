"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CrisisBanner from "@/components/CrisisBanner";
import Disclaimer from "@/components/Disclaimer";
import { GuestBanner } from "@/components/Guest";
import TopMenu, { menuItemClass } from "@/components/TopMenu";
import Waveform from "@/components/Waveform";
import { looksLikeCrisis } from "@/lib/crisis";
import { UPGRADE_PATH } from "@/lib/guest";
import { takeStartVoice } from "@/lib/pending";
import type { Settings } from "@/lib/settings";
import { formatSeconds, useVoiceInput } from "@/lib/useVoiceInput";
import { speak, stopSpeaking } from "@/lib/voice";
import Portrait from "@/components/Portrait";
import { COMPANION_KEY, DEFAULT_COMPANION, getCompanion, type Companion } from "@/prompts/companions";
import { locale, useCopy, useLang } from "@/lib/i18n";

const en = {
  listening: "Listening to your story…",
  writingDown: "Writing it down…",
  thinking: (name: string) => `${name} is thinking…`,
  idle: "Say anything, in English or shqip.",
  backHome: "Back to home",
  ai: "AI companion",
  endAndNew: "End & start new",
  readAloud: (on: boolean) => `Read replies aloud: ${on ? "on" : "off"}`,
  stopRecording: "Stop recording",
  startSpeaking: "Start speaking",
  emptyTitle: "I'm here. Say anything.",
  emptyText: "Type or speak, whatever you like.",
  discard: "Discard recording",
  placeholder: "How are you feeling today? Type here or dictate",
  private: "Private, only for you",
  send: "Send",
  noAnswer: "No answer came back. Please try again.",
  noVoice: "This device has no voice for that language, so I can't read it aloud.",
  pause: "I need a short pause. Send that again in a few seconds.",
  unreachable: "I couldn't reach the AI service. Check your internet connection and try again.",
  generic: "Something went wrong. Please try again.",
  left: (n: number) => (n === 1 ? "1 guest message left today" : `${n} guest messages left today`),
  limitTitle: "That's all the guest messages for today",
  limitText: "Create a free account to keep talking now. It's free, and this conversation comes with you.",
  create: "Create a free account",
  limitLater: "Or come back tomorrow.",
  typing: (name: string) => `${name} is typing…`,
  seen: "Seen",
  live: "Live",
  liveStart: "Talk live, hands-free",
  liveHint: "Just talk. When you pause, I'll answer.",
  liveListening: "I'm listening…",
  liveGotIt: "Got it…",
  liveSpeaking: (name: string) => `${name} is speaking · tap to interrupt`,
  liveEnd: "End live talk",
  liveTapToSend: "Tap to send now",
};
const COPY = {
  en,
  sq: {
    listening: "Po dëgjoj historinë tënde…",
    writingDown: "Po e shkruaj…",
    thinking: (name: string) => `${name} po mendon…`,
    idle: "Thuaj çfarëdo, shqip ose anglisht.",
    backHome: "Kthehu në ballinë",
    ai: "Shoqërues AI",
    endAndNew: "Mbylle dhe fillo të re",
    readAloud: (on: boolean) => `Lexoji përgjigjet me zë: ${on ? "po" : "jo"}`,
    stopRecording: "Ndalo regjistrimin",
    startSpeaking: "Fillo të flasësh",
    emptyTitle: "Jam këtu. Thuaj çfarëdo.",
    emptyText: "Shkruaj ose fol, çfarë të duash.",
    discard: "Fshije regjistrimin",
    placeholder: "Si po ndihesh sot? Shkruaj ose fol këtu",
    private: "Privat, vetëm për ty",
    send: "Dërgo",
    noAnswer: "Nuk erdhi asnjë përgjigje. Provo përsëri.",
    noVoice: "Kjo pajisje nuk ka zë për këtë gjuhë, ndaj s'mund ta lexoj me zë.",
    pause: "Më duhet një pushim i shkurtër. Dërgoje prapë pas pak sekondash.",
    unreachable: "Nuk arrita te shërbimi i AI. Kontrollo internetin dhe provo përsëri.",
    generic: "Diçka shkoi keq. Provo përsëri.",
    left: (n: number) => (n === 1 ? "Të ka mbetur 1 mesazh si mysafir sot" : `Të kanë mbetur ${n} mesazhe si mysafir sot`),
    limitTitle: "Kaq ishin mesazhet si mysafir për sot",
    limitText: "Krijo një llogari falas për të vazhduar tani. Është falas, dhe kjo bisedë vjen me ty.",
    create: "Krijo një llogari falas",
    limitLater: "Ose kthehu nesër.",
    typing: (name: string) => `${name} po shkruan…`,
    seen: "Parë",
    live: "Live",
    liveStart: "Bisedë live, pa duar",
    liveHint: "Thjesht fol. Kur ndalesh, të përgjigjem.",
    liveListening: "Po të dëgjoj…",
    liveGotIt: "E kuptova…",
    liveSpeaking: (name: string) => `${name} po flet · prek për ta ndërprerë`,
    liveEnd: "Mbyll bisedën live",
    liveTapToSend: "Prek për ta dërguar tani",
  } satisfies typeof en,
};

type Message = { role: "user" | "assistant"; content: string; at?: number };

// How a person texts: a moment to read your message, then typing at a natural pace,
// with small pauses after commas and sentences, and typing dots between two messages.
const TICK_MS = 35;
const CHARS_PER_TICK = 2; // about 55 characters a second
const PAUSE_SENTENCE_MS = 260;
const PAUSE_COMMA_MS = 90;
const PAUSE_NEXT_MESSAGE_MS = 1100;
const readingTime = (text: string) => Math.min(2600, 700 + text.length * 16) + Math.random() * 400;

/** Three soft dots: the companion is typing. */
function TypingDots({ label }: { label: string }) {
  return (
    <p
      aria-label={label}
      className="animate-rise flex h-11 items-center gap-1 rounded-3xl rounded-bl-lg border border-white/30 bg-white/15 px-4 backdrop-blur-md"
    >
      {[0, 1, 2].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/85" style={{ animationDelay: `${d * 0.15}s` }} />
      ))}
    </p>
  );
}

const IDLE_MS = 20 * 60 * 1000; // a session ends after 20 minutes of inactivity
const KEYS = { messages: "mind-chat", session: "mind-session", active: "mind-last-active", settings: "mind-settings", speak: "mind-speak" };

const store = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

// Safety net: if the model slips into formatting (**bold**, # headings, - bullets), show it as plain conversation.
const plainText = (text: string) =>
  text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uE000-\uF8FF\uFFFD]/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,!?])/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "");

// Tell the server a session is over so it can write the memory summary.
function endSession(sessionId: string) {
  fetch("/api/session/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
    keepalive: true,
  }).catch(() => {});
}

export default function Chat() {
  const t = useCopy(COPY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speakAloud, setSpeakAloud] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null); // from the server, or the saved copy
  const [settingsFresh, setSettingsFresh] = useState(false); // true once the server has answered
  const [crisis, setCrisis] = useState(false);
  const [companion, setCompanion] = useState<Companion>(DEFAULT_COMPANION); // chosen on the home screen
  const [guestLeft, setGuestLeft] = useState<number | null>(null); // messages left today; null for accounts
  const [live, setLive] = useState(false); // hands-free live talk: listen, answer aloud, listen again
  const [speaking, setSpeaking] = useState(false); // a reply is being read aloud
  const liveRef = useRef(false);
  const { lang } = useLang();
  // The reply as it arrives (target) and how much of it is shown so far, typed out at a human pace.
  const typing = useRef({ target: "", shown: 0, done: true, holdUntil: 0 });
  const typeTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const listRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef("");
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Speaking fills the message box, so I can check the words before sending.
  // In live talk it's sent straight away, like talking to someone.
  const voice = useVoiceInput(
    (text) => {
      if (liveRef.current) send(text);
      else setInput((prev) => (prev ? `${prev} ${text}` : text));
    },
    { autoStop: () => liveRef.current },
  );
  const recording = voice.state === "recording";

  // Live talk keeps the conversation going: whenever nobody is talking or thinking, listen again.
  useEffect(() => {
    if (!live || busy || speaking || voice.state !== "idle" || guestLeft === 0) return;
    const timer = setTimeout(() => {
      if (liveRef.current) voice.listen();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, busy, speaking, voice.state, guestLeft]);

  // No microphone: live talk can't work, so step back to the normal chat (the note says why).
  useEffect(() => {
    if (voice.micBlocked) stopLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.micBlocked]);

  useEffect(() => () => void (liveRef.current = false), []);

  function startLive() {
    stopSpeaking();
    voice.cancel();
    setVoiceNote("");
    liveRef.current = true;
    setLive(true);
  }

  function stopLive() {
    liveRef.current = false;
    setLive(false);
    voice.cancel();
    stopSpeaking();
    setSpeaking(false);
  }

  // The big circle in live talk: interrupt the reply, or send what I said without waiting for a pause.
  function tapOrb() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else if (recording) voice.toggle();
  }

  // Restore the conversation, unless it has been idle long enough to count as over.
  useEffect(() => {
    const savedSession = store.get(KEYS.session);
    let savedMessages: Message[] = [];
    try {
      // Drop empty reply bubbles left behind by a failed request.
      savedMessages = (JSON.parse(store.get(KEYS.messages) ?? "[]") as Message[]).filter((m) => m.content);
    } catch {}
    const idleFor = Date.now() - Number(store.get(KEYS.active) ?? 0);

    if (savedSession && savedMessages.length > 0 && idleFor < IDLE_MS) {
      sessionRef.current = savedSession;
      setMessages(savedMessages);
      startIdleTimer(IDLE_MS - idleFor);
    } else {
      if (savedSession && savedMessages.length > 0) endSession(savedSession);
      sessionRef.current = crypto.randomUUID();
      store.set(KEYS.session, sessionRef.current);
    }
    setSpeakAloud(store.get(KEYS.speak) === "1");
    setCompanion(getCompanion(store.get(COMPANION_KEY)));
    setLoaded(true);
    return () => {
      clearTimeout(idleTimer.current);
      clearInterval(typeTimer.current);
      stopSpeaking();
    };
  }, []);

  // Opened from the home screen: start the mic, or focus the box, as soon as the chat is ready.
  useEffect(() => {
    if (!loaded) return;
    if (takeStartVoice()) voice.toggle();
    else inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Contacts and the disclaimer flag. A saved copy means the banner still works if the network is slow.
  useEffect(() => {
    try {
      const cached = store.get(KEYS.settings);
      if (cached) setSettings(JSON.parse(cached));
    } catch {}
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings(s);
        setSettingsFresh(true);
        store.set(KEYS.settings, JSON.stringify(s));
      })
      .catch(() => {});
  }, []);

  // Guests: how many messages are left today.
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info?.guest) setGuestLeft(info.left);
      })
      .catch(() => {});
  }, []);

  async function acceptDisclaimer() {
    setSettings((s) => s && { ...s, disclaimer_accepted_at: new Date().toISOString() });
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptDisclaimer: true }),
    }).catch(() => {});
  }

  useEffect(() => {
    if (!loaded) return;
    store.set(KEYS.messages, JSON.stringify(messages));
    // Scroll only the message list (scrollIntoView would also shift the card itself).
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: busy ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loaded]);

  function startIdleTimer(ms = IDLE_MS) {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(finishSession, ms);
  }

  // End the current session (summary is written server-side) and start a fresh one.
  function finishSession() {
    clearTimeout(idleTimer.current);
    clearInterval(typeTimer.current);
    typing.current.done = true;
    setBusy(false);
    endSession(sessionRef.current); // the server skips sessions too short to summarize
    sessionRef.current = crypto.randomUUID();
    store.set(KEYS.session, sessionRef.current);
    setMessages([]);
  }

  function toggleSpeakAloud() {
    const next = !speakAloud;
    setSpeakAloud(next);
    store.set(KEYS.speak, next ? "1" : "0");
    if (!next) stopSpeaking();
  }

  async function send(spoken?: string) {
    const text = (spoken ?? input).trim();
    if (!text || busy || guestLeft === 0) return;
    // A message that sounds like danger: stop live talk so the banner with my people gets full attention.
    if (looksLikeCrisis(text)) {
      setCrisis(true);
      if (liveRef.current) stopLive();
    }
    stopSpeaking();
    setVoiceNote("");

    const sentAt = Date.now();
    const history: Message[] = [...messages, { role: "user", content: text, at: sentAt }];
    setMessages([...history, { role: "assistant", content: "", at: sentAt }]);
    if (spoken === undefined) setInput("");
    setBusy(true);
    clearTimeout(idleTimer.current);

    // A moment to "read" my message (longer messages take longer), then the reply is typed out.
    typing.current = { target: "", shown: 0, done: false, holdUntil: sentAt + readingTime(text) };
    clearInterval(typeTimer.current);
    typeTimer.current = setInterval(typeTick, TICK_MS);

    let failure = t.generic;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current,
          messages: history.map(({ role, content }) => ({ role, content })),
          companion: companion.id,
        }),
      });
      // A guest who has used today's messages: put their words back and show the way to keep going.
      if (res.status === 403 && res.headers.get("X-Guest-Left") === "0") {
        clearInterval(typeTimer.current);
        typing.current.done = true;
        setBusy(false);
        setGuestLeft(0);
        setMessages(messages);
        setInput(text);
        if (liveRef.current) stopLive();
        return;
      }
      const left = res.headers.get("X-Guest-Left");
      if (left !== null) setGuestLeft(Number(left));
      if (!res.ok || !res.body) {
        failure = res.status === 429 ? t.pause : res.status === 502 ? t.unreachable : t.generic;
        throw new Error(failure);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        reply += chunk;
        typing.current.target += chunk;
      }
      if (!reply) typing.current.target = t.noAnswer;
      typing.current.done = true;
      // Read the reply aloud in live talk (or when read-aloud is on), then live talk listens again.
      if (reply && (liveRef.current || speakAloud)) {
        setSpeaking(true);
        if (!speak(plainText(reply), () => setSpeaking(false), companion.voice)) {
          setSpeaking(false);
          setVoiceNote(t.noVoice);
        }
      }
    } catch {
      // Show the problem straight away, no typing act.
      typing.current = { target: failure, shown: failure.length, done: true, holdUntil: 0 };
      setReply(failure);
    }
  }

  /** Puts text into the reply bubble being written (the last message). */
  function setReply(content: string) {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "assistant" ? [...prev.slice(0, -1), { ...last, content }] : prev;
    });
  }

  // One beat of typing: a couple of characters, with pauses where a person would pause.
  function typeTick() {
    const ty = typing.current;
    const now = Date.now();
    if (now < ty.holdUntil) return;

    if (ty.shown < ty.target.length) {
      for (let i = 0; i < CHARS_PER_TICK && ty.shown < ty.target.length; i++) {
        // Only spaces or line breaks so far: wait to see if a second message follows.
        if (!ty.done && !ty.target.slice(ty.shown).trim()) break;
        const gap = ty.target.slice(ty.shown).match(/^\s*\n\s*\n\s*/);
        if (gap) {
          // A second message: typing dots for a moment, then it starts.
          ty.shown += gap[0].length;
          ty.holdUntil = now + PAUSE_NEXT_MESSAGE_MS;
          break;
        }
        const ch = ty.target[ty.shown++];
        const next = ty.target[ty.shown];
        if (/[.!?…]/.test(ch) && (next === " " || next === "\n")) {
          ty.holdUntil = now + PAUSE_SENTENCE_MS;
          break;
        }
        if (/[,;:]/.test(ch)) {
          ty.holdUntil = now + PAUSE_COMMA_MS;
          break;
        }
      }
      setReply(ty.target.slice(0, ty.shown));
      return;
    }

    if (ty.done) {
      // Fully typed: the conversation is free again.
      clearInterval(typeTimer.current);
      setReply(ty.target);
      setBusy(false);
      store.set(KEYS.active, String(Date.now()));
      startIdleTimer();
    }
  }


  const status = live
    ? recording
      ? t.liveListening
      : voice.state === "transcribing"
        ? t.liveGotIt
        : busy
          ? t.thinking(companion.name)
          : speaking
            ? t.liveSpeaking(companion.name)
            : t.liveHint
    : recording
      ? t.listening
      : voice.state === "transcribing"
        ? t.writingDown
        : busy
          ? t.typing(companion.name)
          : t.idle;
  const level = voice.levels[voice.levels.length - 1] ?? 0;
  const note = voice.error || voiceNote;
  const empty = loaded && messages.length === 0;

  return (
    <main className="flex h-dvh items-center justify-center p-3 sm:p-6">
      {/* The whole conversation lives inside one calm card, floating over the hills. */}
      <div className="animate-rise relative flex h-full max-h-[880px] w-full max-w-xl flex-col overflow-clip rounded-[2.25rem] border border-white/50 bg-[linear-gradient(150deg,rgba(91,124,86,0.55),rgba(140,166,128,0.38))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_40px_90px_-40px_rgba(30,60,30,0.75)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#d8e6a8]/20 blur-3xl" />

        <header className="relative flex items-start justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="flex min-w-0 items-start gap-2">
            <Link
              href="/"
              aria-label={t.backHome}
              className="-ml-1 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </Link>
            <span
              className="grid h-12 w-12 shrink-0 place-items-end overflow-hidden rounded-full ring-2 ring-white/60"
              style={{ background: `linear-gradient(160deg, ${companion.look.bg[0]}, ${companion.look.bg[1]})` }}
            >
              <Portrait companion={companion} variant="round" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-normal tracking-tight">
                {companion.name} <span className="align-middle text-xs text-white/75">· {t.ai}</span>
              </h1>
              <p className="truncate text-sm text-white/90">{status}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TopMenu current="/chat">
              <button onClick={finishSession} className={menuItemClass}>
                {t.endAndNew}
              </button>
              <button onClick={toggleSpeakAloud} className={menuItemClass}>
                {t.readAloud(speakAloud)}
              </button>
              <hr className="my-1 border-[var(--line)]" />
            </TopMenu>
            {!live && (
              <button
                onClick={startLive}
                disabled={busy || guestLeft === 0}
                title={t.liveStart}
                aria-label={t.liveStart}
                className="flex h-12 items-center gap-1.5 rounded-full border border-white/50 bg-white/20 px-3.5 text-sm font-medium backdrop-blur transition hover:bg-white/30 disabled:opacity-50"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d8f5c0] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8f5c0]" />
                </span>
                {t.live}
              </button>
            )}
            <button
              hidden={live}
              onClick={() => {
                stopSpeaking();
                voice.toggle();
              }}
              disabled={voice.state === "transcribing"}
              aria-label={recording ? t.stopRecording : t.startSpeaking}
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--voice-from)] shadow-md transition hover:scale-105 disabled:opacity-60"
            >
              {recording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {guestLeft !== null && <GuestBanner variant="chat" />}

        {crisis && (
          <div className="relative px-4 pt-4 text-[var(--fg)] sm:px-6">
            <CrisisBanner
              contacts={settings?.emergency_contacts ?? []}
              resources={settings?.crisis_resources ?? []}
              plan={settings?.safety_plan}
              onClose={() => setCrisis(false)}
            />
          </div>
        )}

        <section ref={listRef} className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 [scrollbar-width:thin] sm:px-7">
          {empty && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xl font-normal tracking-tight">{t.emptyTitle}</p>
              <p className="text-base text-white/70">{t.emptyText}</p>
            </div>
          )}
          {messages.map((m, i) => {
            const time = m.at ? new Date(m.at).toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit" }) : "";

            if (m.role === "user") {
              // "Seen" under my latest message, a moment after sending, like a messaging app.
              const seen = i === messages.length - 2 && messages[i + 1]?.role === "assistant";
              return (
                <div key={i} className="animate-rise flex flex-col items-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-white/90 px-4 py-2.5 text-base leading-relaxed text-[#1f2a22] shadow-sm">
                    {m.content}
                  </p>
                  {(time || seen) && (
                    <span className="mt-1 px-1 text-[11px] text-white/70">
                      {time}
                      {seen && <span className="animate-rise [animation-delay:600ms]"> · {t.seen}</span>}
                    </span>
                  )}
                </div>
              );
            }

            // The companion texts like a person: one or two short messages, typed out, with dots in between.
            const writing = busy && i === messages.length - 1;
            const parts = m.content.split(/\n\s*\n/);
            return (
              <div key={i} className="flex flex-col items-start gap-1.5">
                {parts.map((part, j) => {
                  const lastPart = j === parts.length - 1;
                  if (!part.trim()) return writing && lastPart ? <TypingDots key={j} label={t.typing(companion.name)} /> : null;
                  return (
                    <p
                      key={j}
                      className="animate-rise max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-bl-lg border border-white/30 bg-white/15 px-4 py-2.5 text-base leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md"
                    >
                      {plainText(part.trim())}
                      {writing && lastPart && (
                        <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse rounded bg-white/90" />
                      )}
                    </p>
                  );
                })}
                {!writing && time && m.content && <span className="px-1 text-[11px] text-white/70">{time}</span>}
              </div>
            );
          })}
        </section>

        {live ? (
          <div className="relative flex flex-col items-center px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
            <button
              onClick={tapOrb}
              aria-label={speaking ? t.liveSpeaking(companion.name) : recording ? t.liveTapToSend : status}
              className="relative grid h-36 w-36 place-items-center"
            >
              {/* Rings that breathe with my voice, or pulse while the companion speaks. */}
              <span
                className={"absolute inset-0 rounded-full bg-white/15 transition-transform duration-150 " + (speaking ? "animate-ping [animation-duration:2.2s]" : "")}
                style={{ transform: recording ? `scale(${1 + level * 0.45})` : undefined }}
              />
              <span
                className="absolute inset-3 rounded-full border border-white/40 bg-white/10 backdrop-blur transition-transform duration-150"
                style={{ transform: recording ? `scale(${1 + level * 0.25})` : undefined }}
              />
              <span
                className={"relative grid h-24 w-24 place-items-end overflow-hidden rounded-full ring-2 ring-white/70 " + (busy || voice.state === "transcribing" ? "animate-pulse" : "")}
                style={{ background: `linear-gradient(160deg, ${companion.look.bg[0]}, ${companion.look.bg[1]})` }}
              >
                <Portrait companion={companion} variant="round" />
              </span>
            </button>
            <p className="mt-3 text-center text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]">{status}</p>
            {note && <p className="mt-1 text-center text-sm text-white/80">{note}</p>}
            <button
              onClick={stopLive}
              className="mt-4 rounded-full border border-white/50 bg-white/85 px-5 py-2.5 text-sm font-medium text-[#1f2a22] shadow-sm transition hover:bg-white"
            >
              {t.liveEnd}
            </button>
          </div>
        ) : (
        <>
        <div className="relative px-5 sm:px-7">
          <div className={voice.state === "transcribing" ? "animate-pulse" : ""}>
            <Waveform levels={voice.levels} active={recording} className={empty ? "h-20" : "h-10"} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]">
            <button
              onClick={voice.cancel}
              disabled={!recording}
              aria-label={t.discard}
              className="flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
              EN · SQ
            </button>
            <span className="tabular-nums">{formatSeconds(voice.seconds)}</span>
          </div>
        </div>

        {guestLeft === 0 && (
          <div className="relative mx-3 mt-2 rounded-3xl border border-white/70 bg-white/85 p-5 text-center text-[var(--fg)] shadow-lg backdrop-blur-xl sm:mx-4">
            <p className="text-lg tracking-tight">{t.limitTitle}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t.limitText}</p>
            <Link
              href={UPGRADE_PATH}
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-[var(--on-accent)] hover:bg-[var(--accent-strong)]"
            >
              {t.create}
            </Link>
            <p className="mt-2 text-xs text-[var(--muted)]">{t.limitLater}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="relative m-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] rounded-3xl border border-white/70 bg-white/80 p-4 text-[var(--fg)] shadow-lg backdrop-blur-xl sm:m-4"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            disabled={guestLeft === 0}
            placeholder={t.placeholder}
            className="max-h-40 w-full resize-none bg-transparent text-base outline-none placeholder:text-[var(--muted)]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-[var(--muted)]">{note || (guestLeft !== null ? t.left(guestLeft) : t.private)}</span>
            <button
              type="submit"
              disabled={busy || !input.trim() || guestLeft === 0}
              aria-label={t.send}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] transition disabled:bg-[var(--accent-soft)] disabled:text-[var(--muted)]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
        </>
        )}
      </div>
      {settingsFresh && settings && !settings.disclaimer_accepted_at && <Disclaimer onAccept={acceptDisclaimer} />}
    </main>
  );
}
