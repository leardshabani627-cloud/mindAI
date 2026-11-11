// Journal labels and writing prompts. Shared by the browser and the server. Edit freely.

export type JournalTag = "reflection" | "gratitude" | "checkin" | "free";

export const JOURNAL_TAGS: {
  id: JournalTag;
  label: string;
  labelSq: string;
  chip: { background: string; color: string };
  prompts: { en: string; sq: string }[];
}[] = [
  {
    id: "reflection",
    label: "Reflection",
    labelSq: "Reflektim",
    chip: { background: "var(--chip-a-bg)", color: "var(--chip-a-fg)" },
    prompts: [
      { en: "What's been on my mind today?", sq: "Çka më ka rri në mendje sot?" },
      { en: "What did today teach me?", sq: "Çka më mësoi dita e sotme?" },
      { en: "What would I tell a friend in my situation?", sq: "Çka do t'i thoja një shoku në vendin tim?" },
      { en: "What am I avoiding, and why?", sq: "Çka po shmang, dhe pse?" },
    ],
  },
  {
    id: "gratitude",
    label: "Gratitude",
    labelSq: "Mirënjohje",
    chip: { background: "var(--chip-b-bg)", color: "var(--chip-b-fg)" },
    prompts: [
      { en: "Three small things that went okay today", sq: "Tri gjëra të vogla që shkuan mirë sot" },
      { en: "Someone I'm thankful for, and why", sq: "Dikush për të cilin jam mirënjohës, dhe pse" },
      { en: "A moment today I want to remember", sq: "Një moment i sotëm që dua ta mbaj mend" },
    ],
  },
  {
    id: "checkin",
    label: "Check-in",
    labelSq: "Si jam sot",
    chip: { background: "var(--chip-c-bg)", color: "var(--chip-c-fg)" },
    prompts: [
      { en: "How does my body feel right now?", sq: "Si ndihet trupi im tani?" },
      { en: "What do I need more of this week?", sq: "Çka më duhet më shumë këtë javë?" },
      { en: "One thing I can let go of today", sq: "Një gjë që mund ta lë pas sot" },
    ],
  },
  {
    id: "free",
    label: "Free writing",
    labelSq: "Shkrim i lirë",
    chip: { background: "var(--accent-soft)", color: "var(--accent)" },
    prompts: [],
  },
];

export const tagInfo = (id: string) => JOURNAL_TAGS.find((t) => t.id === id) ?? JOURNAL_TAGS[3];
export const isJournalTag = (v: unknown): v is JournalTag => JOURNAL_TAGS.some((t) => t.id === v);

export const tagLabel = (t: (typeof JOURNAL_TAGS)[number], lang: "en" | "sq") => (lang === "sq" ? t.labelSq : t.label);
