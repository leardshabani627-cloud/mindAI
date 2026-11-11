"use client";

import { useLang, type Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; short: string; name: string }[] = [
  { lang: "en", short: "EN", name: "English" },
  { lang: "sq", short: "SQ", name: "Shqip" },
];

/** EN | SQ switch. Changes every page at once and is remembered. */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div role="radiogroup" aria-label="Language / Gjuha" className={`glass flex rounded-full p-1 text-xs ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          role="radio"
          aria-checked={lang === o.lang}
          title={o.name}
          onClick={() => setLang(o.lang)}
          className={
            "rounded-full px-2.5 py-1 font-medium transition " +
            (lang === o.lang ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)] hover:text-[var(--fg)]")
          }
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
