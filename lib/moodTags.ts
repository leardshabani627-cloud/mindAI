// "What's affecting you today?" choices for the mood check-in. Shared by the browser and the server.
// Ids are stored in the database, so don't rename them; labels and icons can change freely.

export const MOOD_TAGS = [
  { id: "sleep", icon: "😴", en: "Sleep", sq: "Gjumi" },
  { id: "work", icon: "💼", en: "Work / school", sq: "Puna / shkolla" },
  { id: "family", icon: "🏠", en: "Family", sq: "Familja" },
  { id: "friends", icon: "👥", en: "Friends", sq: "Shoqëria" },
  { id: "relationship", icon: "💞", en: "Relationship", sq: "Lidhja" },
  { id: "health", icon: "🩺", en: "Health", sq: "Shëndeti" },
  { id: "money", icon: "💰", en: "Money", sq: "Paratë" },
  { id: "lonely", icon: "🌙", en: "Feeling alone", sq: "Vetmia" },
  { id: "exercise", icon: "🏃", en: "Exercise", sq: "Lëvizja" },
  { id: "weather", icon: "🌦️", en: "Weather", sq: "Moti" },
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number]["id"];

export const MAX_MOOD_TAGS = 5;

export const moodTag = (id: string) => MOOD_TAGS.find((t) => t.id === id);

/** Keeps only known ids, without duplicates. Returns null if the input isn't a list of strings. */
export function cleanMoodTags(value: unknown): MoodTag[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_MOOD_TAGS) return null;
  if (value.some((v) => typeof v !== "string")) return null;
  return [...new Set(value)].filter((v): v is MoodTag => MOOD_TAGS.some((t) => t.id === v));
}
