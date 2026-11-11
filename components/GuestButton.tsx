"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GUEST_DAILY_MESSAGES } from "@/lib/guest";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const en = {
  label: "Continue as guest",
  starting: "Opening…",
  hint: (n: number) => `Try Mind without an account: ${n} messages a day, nothing remembered.`,
  notSetUp: "Guest visits aren't switched on yet. Please use your email.",
  failed: "Couldn't start a guest visit. Please try again.",
};
const COPY = {
  en,
  sq: {
    label: "Vazhdo si mysafir",
    starting: "Po hapet…",
    hint: (n: number) => `Provo Mind pa llogari: ${n} mesazhe në ditë, asgjë nuk mbahet mend.`,
    notSetUp: "Vizitat si mysafir nuk janë aktivizuar ende. Përdor email-in tënd.",
    failed: "Vizita si mysafir nuk filloi. Provo përsëri.",
  } satisfies typeof en,
};

/** Try Mind without an account (Supabase anonymous sign-in). An account can be made later, keeping everything. */
export default function GuestButton() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError("");
    // Ask Supabase first, so a switched-off setting shows a clear message instead of an error.
    const enabled = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((r) => r.json())
      .then((s) => s?.external?.anonymous_users === true)
      .catch(() => false);
    if (!enabled) {
      setBusy(false);
      return setError(t.notSetUp);
    }
    const { error } = await browserClient().auth.signInAnonymously();
    if (error) {
      setBusy(false);
      return setError(t.failed);
    }
    // Guests go through the welcome steps from the home page too.
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full rounded-lg border border-white/80 bg-white/30 px-5 py-3 text-[15px] text-[#111] transition hover:bg-white/60 disabled:opacity-40"
      >
        {busy ? t.starting : t.label}
      </button>
      <p className="mt-2 text-center text-xs text-[#626a64]">{error || t.hint(GUEST_DAILY_MESSAGES)}</p>
    </div>
  );
}
