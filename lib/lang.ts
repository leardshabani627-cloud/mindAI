// Shared by the server and the browser (no React here).
export type Lang = "en" | "sq";
export const LANG_COOKIE = "mind-lang";

/** For dates and month names. */
export const locale = (lang: Lang) => (lang === "sq" ? "sq-AL" : "en-US");
