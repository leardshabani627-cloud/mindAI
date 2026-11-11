"use client";

import { useEffect, useState } from "react";
import { COUNTRIES, countryByCode, guessCountry, type Service } from "@/lib/emergency";
import { useCopy, useLang } from "@/lib/i18n";

const COUNTRY_KEY = "mind-country"; // the country chosen for emergency numbers (this device)

const en = {
  title: "In danger right now? Call",
  country: "Country for emergency numbers",
  services: { emergency: "Emergency", police: "Police", ambulance: "Ambulance", fire: "Fire" } as Record<Service, string>,
  call: (what: string, number: string) => `Call ${what}: ${number}`,
  note: "Tap to call from your phone. Wrong country? Change it above.",
};
const COPY = {
  en,
  sq: {
    title: "Në rrezik tani? Telefono",
    country: "Shteti për numrat e urgjencës",
    services: { emergency: "Urgjenca", police: "Policia", ambulance: "Ambulanca", fire: "Zjarrfikësit" } as Record<Service, string>,
    call: (what: string, number: string) => `Telefono ${what}: ${number}`,
    note: "Prek për të telefonuar nga telefoni. Shteti i gabuar? Ndryshoje lart.",
  } satisfies typeof en,
};

// Written out in full so Tailwind can see the class names.
const GRID: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" };

const ICONS: Record<Service, string> = { emergency: "🆘", police: "🚓", ambulance: "🚑", fire: "🚒" };

/** Big tap-to-call buttons for the official emergency services of the person's country. */
export default function EmergencyNumbers() {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [code, setCode] = useState<string | null>(null); // decided in the browser (time zone, saved choice)

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(COUNTRY_KEY);
    } catch {}
    setCode(countryByCode(saved)?.code ?? guessCountry(lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(next: string) {
    setCode(next);
    try {
      localStorage.setItem(COUNTRY_KEY, next);
    } catch {}
  }

  const country = countryByCode(code);

  return (
    <div className="rounded-2xl bg-[#fbeae5] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-medium text-[#7a2e1f]">{t.title}</p>
        <select
          value={code ?? ""}
          onChange={(e) => choose(e.target.value)}
          aria-label={t.country}
          className="rounded-full border border-[#e9c3b6] bg-white px-2.5 py-1 text-sm text-[#7a2e1f] outline-none focus:ring-2 focus:ring-[#c4664a]/40"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c[lang]}
            </option>
          ))}
        </select>
      </div>

      {country && (
        <div className={"mt-2.5 grid gap-2 " + GRID[Math.min(4, country.numbers.length)]}>
          {country.numbers.map(({ service, number }) => (
            <a
              key={service}
              href={`tel:${number}`}
              aria-label={t.call(t.services[service], number)}
              className="flex flex-col items-center rounded-xl bg-white px-2 py-2 text-[#7a2e1f] shadow-sm transition hover:bg-[#fff5f2] active:scale-[0.98]"
            >
              <span className="text-lg leading-none" aria-hidden>
                {ICONS[service]}
              </span>
              <span className="mt-1 text-xl font-semibold tabular-nums">{number}</span>
              <span className="text-xs">{t.services[service]}</span>
            </a>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-[#8f4a37]">{t.note}</p>
    </div>
  );
}
