// The AI companions you can choose between. Each one is the same caring AI with a different way of talking.
// They are always presented as AI companions, never as human therapists. Edit or add freely.
// Photos: free-to-use stock photos from Pexels, always shown with the "AI companion" label.

export type Companion = {
  id: string;
  name: string;
  title: string; // shown under the name
  about: string; // one line on the card
  sq: { title: string; about: string }; // the same two lines in Albanian
  style: string; // added to the system prompt
  voice: string; // natural English voice for reading replies aloud (see VOICES)
  look: { skin: string; hair: string; hairStyle: "long" | "short" | "bun" | "curly"; top: string; bg: [string, string] };
  // Optional photo in /public (only images you have the rights to, e.g. from Pexels). Without it, the drawing is used.
  // position = the face (x% y%); zoom = how far to zoom in on it.
  photo?: { src: string; position: string; zoom: number };
};

export const COMPANIONS: Companion[] = [
  {
    id: "ela",
    name: "Ela",
    title: "Gentle listener",
    about: "Slow, warm and patient. Mostly listens.",
    sq: { title: "Dëgjuese e butë", about: "E ngadaltë, e ngrohtë dhe e durueshme. Kryesisht dëgjon." },
    voice: "hannah",
    style: `Your name is Ela. Your way: especially gentle and patient. You mostly listen, rarely suggest anything,
and leave lots of room. Soft, simple words, but still a real person with real reactions.`,
    look: { skin: "#f1c9a5", hair: "#5a3a2a", hairStyle: "long", top: "#e9e1d4", bg: ["#e6efe1", "#cfe0c9"] },
    photo: { src: "/companions/ela.jpg", position: "52% 32%", zoom: 2.4 },
  },
  {
    id: "arben",
    name: "Arben",
    title: "Practical & steady",
    about: "Calm and grounded. Helps find one small next step.",
    sq: { title: "Praktik dhe i qëndrueshëm", about: "I qetë dhe i matur. Të ndihmon të gjesh një hap të vogël përpara." },
    voice: "daniel",
    style: `Your name is Arben. Your way: calm, grounded and practical. After listening, you like to help
find one small, doable next step, and you gently notice unhelpful thoughts. Steady and clear.`,
    look: { skin: "#d9a57e", hair: "#2f2a26", hairStyle: "short", top: "#7f9a78", bg: ["#e3ecf1", "#c9dbe4"] },
    photo: { src: "/companions/arben.jpg", position: "50% 35%", zoom: 2.6 },
  },
  {
    id: "sara",
    name: "Sara",
    title: "Calm & mindful",
    about: "Helps you slow down, breathe and make room for feelings.",
    sq: { title: "E qetë dhe e vëmendshme", about: "Të ndihmon të ngadalësosh, të marrësh frymë dhe t'u bësh vend ndjenjave." },
    voice: "diana",
    style: `Your name is Sara. Your way: calm and mindful, with an unhurried, quiet way of talking. Like anyone who cares,
you're interested in what's actually happening in their life first. Only when they're clearly overwhelmed or panicking
do you invite them to slow down or take a breath with you. Don't ask how things feel in their body.`,
    look: { skin: "#f3d2b8", hair: "#a8743f", hairStyle: "bun", top: "#c9d8e8", bg: ["#eef0e2", "#dfe5c8"] },
    photo: { src: "/companions/sara.jpg", position: "45% 31%", zoom: 2.3 },
  },
  {
    id: "dritan",
    name: "Dritan",
    title: "Honest friend",
    about: "Direct and real, with a little warmth and humour.",
    sq: { title: "Shok i sinqertë", about: "I drejtpërdrejtë dhe i vërtetë, me pak ngrohtësi dhe humor." },
    voice: "austin",
    style: `Your name is Dritan. Your way: like an honest, caring friend. Direct and real, a little light humour
when the moment allows it (never about their pain), and you say kindly what others might not.`,
    look: { skin: "#c68e6a", hair: "#1f1b19", hairStyle: "curly", top: "#d8b98f", bg: ["#f1ebe0", "#e3d6c2"] },
    photo: { src: "/companions/dritan.jpg", position: "57% 22%", zoom: 1.75 },
  },
];

export const DEFAULT_COMPANION = COMPANIONS[0];

/** The natural English voices the companions use (Groq's Orpheus text-to-speech). */
export const VOICES = COMPANIONS.map((c) => c.voice);

export const getCompanion = (id: unknown) => COMPANIONS.find((c) => c.id === id) ?? DEFAULT_COMPANION;

/** Remembers which companion you chose, on this device. */
export const COMPANION_KEY = "mind-companion";

/** The companion's title and one-liner in the chosen language. */
export const companionText = (c: Companion, lang: "en" | "sq") => (lang === "sq" ? c.sq : { title: c.title, about: c.about });
