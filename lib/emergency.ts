// Official emergency service numbers (police, ambulance, fire, and the general emergency line) by country,
// shown as tap-to-call buttons in the Help panel and the crisis banner. Shared by browser and server.
//
// Only official public emergency services are listed here: they rarely change. Crisis helplines are added by
// each person in Settings (they change more often). Before adding a country, check its official sources.

export type Service = "emergency" | "police" | "ambulance" | "fire";

export type Country = {
  code: string;
  flag: string;
  en: string;
  sq: string;
  numbers: { service: Service; number: string }[];
};

export const COUNTRIES: Country[] = [
  {
    code: "XK",
    flag: "🇽🇰",
    en: "Kosovo",
    sq: "Kosova",
    numbers: [
      { service: "police", number: "192" },
      { service: "ambulance", number: "194" },
      { service: "fire", number: "193" },
    ],
  },
  {
    code: "AL",
    flag: "🇦🇱",
    en: "Albania",
    sq: "Shqipëria",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "police", number: "129" },
      { service: "ambulance", number: "127" },
      { service: "fire", number: "128" },
    ],
  },
  {
    code: "MK",
    flag: "🇲🇰",
    en: "North Macedonia",
    sq: "Maqedonia e Veriut",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "police", number: "192" },
      { service: "ambulance", number: "194" },
      { service: "fire", number: "193" },
    ],
  },
  {
    code: "ME",
    flag: "🇲🇪",
    en: "Montenegro",
    sq: "Mali i Zi",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "police", number: "122" },
      { service: "ambulance", number: "124" },
      { service: "fire", number: "123" },
    ],
  },
  {
    code: "RS",
    flag: "🇷🇸",
    en: "Serbia",
    sq: "Serbia",
    numbers: [
      { service: "police", number: "192" },
      { service: "ambulance", number: "194" },
      { service: "fire", number: "193" },
    ],
  },
  {
    code: "DE",
    flag: "🇩🇪",
    en: "Germany",
    sq: "Gjermania",
    numbers: [
      { service: "ambulance", number: "112" },
      { service: "police", number: "110" },
    ],
  },
  {
    code: "CH",
    flag: "🇨🇭",
    en: "Switzerland",
    sq: "Zvicra",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "police", number: "117" },
      { service: "ambulance", number: "144" },
      { service: "fire", number: "118" },
    ],
  },
  {
    code: "AT",
    flag: "🇦🇹",
    en: "Austria",
    sq: "Austria",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "police", number: "133" },
      { service: "ambulance", number: "144" },
      { service: "fire", number: "122" },
    ],
  },
  {
    code: "IT",
    flag: "🇮🇹",
    en: "Italy",
    sq: "Italia",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "ambulance", number: "118" },
    ],
  },
  {
    code: "FR",
    flag: "🇫🇷",
    en: "France",
    sq: "Franca",
    numbers: [
      { service: "emergency", number: "112" },
      { service: "ambulance", number: "15" },
      { service: "police", number: "17" },
      { service: "fire", number: "18" },
    ],
  },
  {
    code: "GB",
    flag: "🇬🇧",
    en: "United Kingdom",
    sq: "Mbretëria e Bashkuar",
    numbers: [{ service: "emergency", number: "999" }],
  },
  {
    code: "US",
    flag: "🇺🇸",
    en: "United States",
    sq: "SHBA",
    numbers: [{ service: "emergency", number: "911" }],
  },
  {
    code: "CA",
    flag: "🇨🇦",
    en: "Canada",
    sq: "Kanada",
    numbers: [{ service: "emergency", number: "911" }],
  },
  {
    code: "EU",
    flag: "🇪🇺",
    en: "Elsewhere in Europe",
    sq: "Gjetiu në Evropë",
    numbers: [{ service: "emergency", number: "112" }],
  },
];

// A first guess from the device's time zone (the person can always change it).
const BY_TIME_ZONE: Record<string, string> = {
  "Europe/Tirane": "AL",
  "Europe/Belgrade": "XK", // Kosovo shares this time zone; most people using Mind there are in Kosovo
  "Europe/Skopje": "MK",
  "Europe/Podgorica": "ME",
  "Europe/Berlin": "DE",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Rome": "IT",
  "Europe/Paris": "FR",
  "Europe/London": "GB",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Montreal": "CA",
};

// Windows puts Kosovo (and much of the region) in one shared zone, often shown as Budapest or Prague.
const CENTRAL_EUROPE = ["Europe/Belgrade", "Europe/Budapest", "Europe/Prague", "Europe/Bratislava", "Europe/Ljubljana", "Europe/Zagreb", "Europe/Sarajevo"];

/** A first guess: an Albanian browser language with a region (sq-XK, sq-AL, sq-MK), then the time zone.
 *  (The region of an English setting like en-GB says nothing about where someone lives, so it's ignored.) */
export function guessCountry(appLang: "en" | "sq" = "en"): string {
  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const [language, region] = tag.split("-");
      if (language.toLowerCase() === "sq" && region && countryByCode(region.toUpperCase())) return region.toUpperCase();
    }
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (appLang === "sq" && CENTRAL_EUROPE.includes(zone)) return "XK";
    if (BY_TIME_ZONE[zone]) return BY_TIME_ZONE[zone];
    if (zone.startsWith("America/")) return "US";
    if (zone.startsWith("Europe/")) return "EU";
  } catch {}
  return "XK";
}

export const countryByCode = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code);
