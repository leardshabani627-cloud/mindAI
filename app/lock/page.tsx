"use client";

import { useState } from "react";
import PinPad from "@/components/PinPad";
import Wordmark from "@/components/Wordmark";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const en = {
  title: "Mind is locked",
  enter: "Enter your PIN",
  wrong: "That PIN isn't right. Try again.",
  wait: "Too many tries. Please wait 5 minutes and try again.",
  error: "Something went wrong. Please try again.",
  forgot: "Forgot your PIN?",
  forgotHint: "Sign out, then sign in again with your email or Google. You can set a new PIN in Settings.",
  signOut: "Sign out",
};
const COPY = {
  en,
  sq: {
    title: "Mind është i kyçur",
    enter: "Shkruaj PIN-in tënd",
    wrong: "Ky PIN nuk është i saktë. Provo përsëri.",
    wait: "Shumë përpjekje. Prit 5 minuta dhe provo përsëri.",
    error: "Diçka shkoi keq. Provo përsëri.",
    forgot: "E ke harruar PIN-in?",
    forgotHint: "Dil, pastaj hyr përsëri me email ose Google. PIN-in e ri e vendos te Cilësimet.",
    signOut: "Dil",
  } satisfies typeof en,
};

// The app lock: four digits before anything in Mind shows. The server checks the PIN.
export default function LockPage() {
  const t = useCopy(COPY);
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  async function unlock(pin: string) {
    const res = await fetch("/api/lock/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    }).catch(() => null);
    const result = res ? (await res.json().catch(() => ({}))).result : "error";
    if (result === "ok") {
      const next = new URLSearchParams(location.search).get("next") ?? "/";
      location.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      return;
    }
    const text = result === "wrong" ? t.wrong : result === "wait" ? t.wait : t.error;
    setMessage(text);
    return text;
  }

  async function signOut() {
    await browserClient().auth.signOut();
    location.replace("/login");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="glass animate-rise w-full max-w-sm rounded-[2.25rem] px-6 py-8 text-center sm:px-8">
        <div className="flex items-center justify-between">
          <Wordmark className="text-2xl" />
          <LanguageSwitch />
        </div>

        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className="mt-4 text-2xl tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.enter}</p>

        <div className="mt-6">
          <PinPad onComplete={unlock} />
        </div>
        <p className="mt-4 min-h-5 text-sm text-red-600" role="alert">
          {message}
        </p>

        <div className="mt-4 border-t border-[var(--line)] pt-4 text-sm">
          {showForgot ? (
            <>
              <p className="text-[var(--muted)]">{t.forgotHint}</p>
              <button onClick={signOut} className="mt-3 rounded-full border border-[var(--line)] bg-white px-4 py-2 hover:bg-[var(--accent-soft)]">
                {t.signOut}
              </button>
            </>
          ) : (
            <button onClick={() => setShowForgot(true)} className="text-[var(--muted)] underline-offset-2 hover:underline">
              {t.forgot}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
