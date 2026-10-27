// The personal safety plan, based on the Stanley-Brown Safety Plan used by therapists.
// Steps 4 and 5 (people to ask for help, professionals and crisis lines) are the contacts from Settings.
// Shared by the browser and the server. Edit the wording freely.

export type PlanKey = "reasons" | "warning_signs" | "coping" | "distractions" | "safe_steps";
export type SafetyPlan = Partial<Record<PlanKey, string[]>>;

export const PLAN_SECTIONS: { key: PlanKey; en: string; sq: string; hint: string; example: string }[] = [
  {
    key: "reasons",
    en: "My reasons to keep going",
    sq: "Arsyet e mia për të vazhduar",
    hint: "The people, things or hopes that matter most to me.",
    example: "My little brother. Finishing my studies. Seeing the sea again.",
  },
  {
    key: "warning_signs",
    en: "My warning signs",
    sq: "Shenjat e mia paralajmëruese",
    hint: "Thoughts, feelings or situations that tell me a hard moment is coming.",
    example: "I stop answering messages. I think “nothing will ever change”.",
  },
  {
    key: "coping",
    en: "Things I can do on my own",
    sq: "Çka mund të bëj vetë",
    hint: "Small things that calm me or take my mind off it, without anyone else.",
    example: "A hot shower. A walk. My playlist. Two minutes of breathing in Mind.",
  },
  {
    key: "distractions",
    en: "People and places that help",
    sq: "Njerëz e vende që më ndihmojnë",
    hint: "Where I can go, or who I can be around, even without talking about it.",
    example: "The café near home. My cousin's place. The park.",
  },
  {
    key: "safe_steps",
    en: "Making my surroundings safer",
    sq: "Ta bëj ambientin më të sigurt",
    hint: "Ways to keep anything I could hurt myself with out of reach.",
    example: "Ask my sister to keep my medication for me.",
  },
];

const MAX_ITEMS = 10;
const MAX_CHARS = 200;

/** Returns a clean plan, or null if the input isn't { key: string[] }. */
export function cleanPlan(value: unknown): SafetyPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const plan: SafetyPlan = {};
  for (const { key } of PLAN_SECTIONS) {
    const list = (value as Record<string, unknown>)[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || list.length > MAX_ITEMS || list.some((s) => typeof s !== "string")) return null;
    plan[key] = (list as string[]).map((s) => s.trim().slice(0, MAX_CHARS)).filter(Boolean);
  }
  return plan;
}

export const planIsEmpty = (plan: SafetyPlan | undefined) =>
  !plan || PLAN_SECTIONS.every(({ key }) => !plan[key]?.length);
