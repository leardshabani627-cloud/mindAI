// The personal safety plan, based on the Stanley-Brown Safety Plan used by therapists.
// Steps 4 and 5 (people to ask for help, professionals and crisis lines) are the contacts from Settings.
// Shared by the browser and the server. Edit the wording freely (English and Albanian side by side).

export type PlanKey = "reasons" | "warning_signs" | "coping" | "distractions" | "safe_steps";
export type SafetyPlan = Partial<Record<PlanKey, string[]>>;

type Words = { title: string; hint: string; example: string };

export const PLAN_SECTIONS: { key: PlanKey; en: Words; sq: Words }[] = [
  {
    key: "reasons",
    en: {
      title: "My reasons to keep going",
      hint: "The people, things or hopes that matter most to me.",
      example: "My little brother. Finishing my studies. Seeing the sea again.",
    },
    sq: {
      title: "Arsyet e mia për të vazhduar",
      hint: "Njerëzit, gjërat ose shpresat që kanë më shumë rëndësi për mua.",
      example: "Vëllai im i vogël. Të mbaroj studimet. Ta shoh detin prapë.",
    },
  },
  {
    key: "warning_signs",
    en: {
      title: "My warning signs",
      hint: "Thoughts, feelings or situations that tell me a hard moment is coming.",
      example: "I stop answering messages. I think “nothing will ever change”.",
    },
    sq: {
      title: "Shenjat e mia paralajmëruese",
      hint: "Mendime, ndjenja ose situata që më tregojnë se po vjen një moment i vështirë.",
      example: "Nuk u përgjigjem mesazheve. Mendoj “asgjë s’do të ndryshojë kurrë”.",
    },
  },
  {
    key: "coping",
    en: {
      title: "Things I can do on my own",
      hint: "Small things that calm me or take my mind off it, without anyone else.",
      example: "A hot shower. A walk. My playlist. Two minutes of breathing in Mind.",
    },
    sq: {
      title: "Çka mund të bëj vetë",
      hint: "Gjëra të vogla që më qetësojnë ose ma largojnë mendjen, pa pasur nevojë për dikë tjetër.",
      example: "Një dush i ngrohtë. Një shëtitje. Muzika ime. Dy minuta frymëmarrje në Mind.",
    },
  },
  {
    key: "distractions",
    en: {
      title: "People and places that help",
      hint: "Where I can go, or who I can be around, even without talking about it.",
      example: "The café near home. My cousin's place. The park.",
    },
    sq: {
      title: "Njerëz dhe vende që më ndihmojnë",
      hint: "Ku mund të shkoj, ose me kë mund të rri, edhe pa folur për këtë.",
      example: "Kafeneja afër shtëpisë. Te kushëriri im. Parku.",
    },
  },
  {
    key: "safe_steps",
    en: {
      title: "Making my surroundings safer",
      hint: "Ways to keep anything I could hurt myself with out of reach.",
      example: "Ask my sister to keep my medication for me.",
    },
    sq: {
      title: "Ta bëj ambientin më të sigurt",
      hint: "Mënyra për t’i mbajtur larg gjërat me të cilat mund ta lëndoj veten.",
      example: "T’i kërkoj motrës të m’i ruajë ilaçet.",
    },
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
