"use client";

import { useState } from "react";
import { authSecondary } from "@/components/AuthShell";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const en = { label: "Continue with Google", notSetUp: "Google sign-in isn't switched on yet. Please use your email." };
const COPY = {
  en,
  sq: {
    label: "Vazhdo me Google",
    notSetUp: "Hyrja me Google nuk është aktivizuar ende. Përdor email-in tënd.",
  } satisfies typeof en,
};

/** Sign in or sign up with Google (needs the Google provider switched on in Supabase). */
export default function GoogleButton({ disabled = false }: { disabled?: boolean }) {
  const t = useCopy(COPY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError("");
    // Ask Supabase first: if Google isn't switched on, the redirect would land on a raw error page.
    const enabled = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((r) => r.json())
      .then((s) => s?.external?.google === true)
      .catch(() => false);
    if (!enabled) {
      setBusy(false);
      return setError(t.notSetUp);
    }
    const { error } = await browserClient().auth.signInWithOAuth({
      provider: "google",
      // New people go through the welcome steps from the home page; others land straight home.
      options: { redirectTo: `${location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setBusy(false);
      setError(t.notSetUp);
    }
  }

  return (
    <div>
      <button type="button" onClick={go} disabled={disabled || busy} className={authSecondary}>
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {t.label}
      </button>
      {error && <p className="mt-2 text-center text-sm text-[#6b736c]">{error}</p>}
    </div>
  );
}
