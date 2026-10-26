// Spots signs of self-harm or hopelessness in what the user types, so the app can show a gentle banner.
// It runs in the browser: the check never sends anything anywhere. Edit the lists freely.
//
// It is a simple phrase match, so it will miss things and sometimes fire when it doesn't need to.
// The companion's own prompt also watches for danger; this is an extra safety net, not a diagnosis.

// Written without accents and in lower case: messages are normalized the same way before matching.
const PHRASES = [
  // English
  "kill myself", "killing myself", "suicide", "suicidal", "end my life", "take my own life",
  "want to die", "wanna die", "better off dead", "hurt myself", "harm myself", "self harm",
  "self-harm", "cut myself", "no reason to live", "dont want to live", "don't want to live",
  "not want to be here", "cant go on", "can't go on", "hopeless", "no hope", "give up on life",
  // Albanian
  "vetevrasje", "vras veten", "te vras veten", "dua te vdes", "me mire te vdes", "mbaroj jeten",
  "nuk dua te jetoj", "s'dua te jetoj", "sdua te jetoj", "nuk kam arsye per te jetuar",
  "te bej keq vetes", "te demtoj veten", "pa shprese", "nuk kam shprese", "s'kam shprese",
  "nuk durohet me", "s'ia dal me",
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // e with diaeresis -> e, c with cedilla -> c, ...
    .replace(/[’‘`]/g, "'");
}

export function looksLikeCrisis(message: string) {
  const text = normalize(message);
  return PHRASES.some((p) => text.includes(p));
}
