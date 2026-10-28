"use client";

import { createContext, useContext, useState } from "react";
import { LANG_COOKIE, type Lang } from "@/lib/lang";

export { locale, type Lang } from "@/lib/lang";

// Two languages: English and Albanian (shqip). Each page keeps its own words next to its code, as
//   const en = { title: "..." };
//   const COPY = { en, sq: { title: "..." } satisfies typeof en };
// and reads them with useCopy(COPY). TypeScript then insists both languages have every entry.

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);

  function setLang(next: Lang) {
    // A cookie (not just this tab) so the server renders the next page in the same language.
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    setLangState(next);
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** This page's words in the chosen language. */
export function useCopy<T>(copy: { en: T; sq: T }): T {
  return copy[useLang().lang];
}
