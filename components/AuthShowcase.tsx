"use client";

import Portrait from "@/components/Portrait";
import Scenery from "@/components/Scenery";
import { useCopy } from "@/lib/i18n";
import { serif } from "@/lib/fonts";
import { DEFAULT_COMPANION, companionText } from "@/prompts/companions";
import { useLang } from "@/lib/i18n";

const en = {
  you: "Rough day today.",
  reply: "I'm here. Want to tell me what happened?",
  moodTitle: "Mood this week",
  moodLine: "Lighter than last week",
  ai: "AI companion",
  tagline: "A calm, private space to talk.",
  sub: "Talk, breathe, write, and notice what helps. Only you can see it.",
};
const COPY = {
  en,
  sq: {
    you: "Ditë e rëndë sot.",
    reply: "Jam këtu. Do të më tregosh çfarë ndodhi?",
    moodTitle: "Gjendja këtë javë",
    moodLine: "Më lehtë se java e kaluar",
    ai: "Shoqërues AI",
    tagline: "Një hapësirë e qetë dhe private për të folur.",
    sub: "Fol, merr frymë, shkruaj dhe vëre çka të ndihmon. Vetëm ti e sheh.",
  } satisfies typeof en,
};

// The right half of the sign-in screens: a quiet preview of Mind itself, over the hills.
// Purely decorative (the same look as inside the app), not a real conversation.
export default function AuthShowcase() {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const c = DEFAULT_COMPANION;

  return (
    <aside aria-hidden className="relative hidden overflow-hidden bg-[#dfe7da] lg:block">
      <Scenery contained />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(150,182,128,0.4)_0%,rgba(150,182,128,0.1)_40%,transparent_55%,rgba(31,59,44,0.55)_100%)]" />

      {/* companion card */}
      <div className="absolute top-[10%] left-[9%] flex w-64 items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-[0_20px_50px_-25px_rgba(20,50,30,0.6)] backdrop-blur">
        <span
          className="grid h-12 w-12 shrink-0 place-items-end overflow-hidden rounded-full"
          style={{ background: `linear-gradient(160deg, ${c.look.bg[0]}, ${c.look.bg[1]})` }}
        >
          <Portrait companion={c} variant="round" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] text-[#1d221e]">{c.name}</span>
          <span className="block truncate text-xs text-[#6b736c]">
            {companionText(c, lang).title} · {t.ai}
          </span>
        </span>
      </div>

      {/* a short chat */}
      <div className="absolute top-[28%] right-[8%] w-[19rem] space-y-2 rounded-3xl bg-gradient-to-br from-[#6b8865] to-[#95ab8b] p-4 shadow-[0_30px_70px_-30px_rgba(20,50,30,0.7)]">
        <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-white px-3.5 py-2 text-sm text-[#1d221e]">{t.you}</p>
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-white/20 bg-black/15 px-3.5 py-2 text-sm text-white">
          {t.reply}
        </p>
        <div className="flex h-6 items-center gap-[3px] pt-1" >
          {[0.3, 0.6, 0.4, 0.9, 0.5, 0.75, 0.35, 0.8, 0.45, 0.6, 0.3, 0.7, 0.5, 0.85, 0.4, 0.6, 0.3, 0.5].map((h, i) => (
            <span key={i} className="w-[3px] flex-1 rounded-full bg-white/80" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
      </div>

      {/* mood card */}
      <div className="absolute top-[55%] left-[12%] w-60 rounded-2xl bg-white/90 p-4 shadow-[0_20px_50px_-25px_rgba(20,50,30,0.6)] backdrop-blur">
        <p className="text-xs text-[#6b736c]">{t.moodTitle}</p>
        <p className="text-3xl tracking-tight text-[#1d221e]">68%</p>
        <p className="text-xs text-[#6b736c]">{t.moodLine}</p>
        <div className="mt-2 flex h-5 gap-px overflow-hidden rounded-md">
          {["#e2e9de", "#d3dfcd", "#c4d4bc", "#b3c8a9", "#5b8453", "#b3c8a9", "#d3dfcd"].map((bg, i) => (
            <span key={i} className="flex-1" style={{ background: bg }} />
          ))}
        </div>
      </div>

      {/* tagline */}
      <div className="absolute right-[9%] bottom-[8%] left-[9%] text-white">
        <p className={`${serif.className} text-[2.1rem] leading-tight`}>{t.tagline}</p>
        <p className="mt-2 max-w-md text-[15px] text-white/85">{t.sub}</p>
      </div>
    </aside>
  );
}
