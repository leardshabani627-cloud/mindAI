"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authField, authLabel } from "@/components/AuthShell";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const RESEND_WAIT = 60; // seconds before another code can be sent

const en = {
  intro: (email: string) => `We sent a code to ${email}. Enter it below to verify your account.`,
  label: "Verification code",
  placeholder: "Enter the code",
  verifying: "Checking…",
  verify: "Verify and continue",
  noCode: "Didn't get it? Check your spam folder, or",
  resend: "send a new code",
  resendIn: (s: number) => `You can ask for a new code in ${s}s.`,
  resent: "A new code is on its way.",
  wrong: "That code isn't right, or it has expired. Check the latest email, or ask for a new code.",
  tooMany: "Too many tries. Please wait a little and try again.",
  otherEmail: "Use a different email",
};
const COPY = {
  en,
  sq: {
    intro: (email: string) => `Të dërguam një kod në ${email}. Shkruaje më poshtë për të verifikuar llogarinë.`,
    label: "Kodi i verifikimit",
    placeholder: "Shkruaj kodin",
    verifying: "Po kontrollohet…",
    verify: "Verifiko dhe vazhdo",
    noCode: "S'të erdhi? Shiko te spam-i, ose",
    resend: "dërgo një kod të ri",
    resendIn: (s: number) => `Mund të kërkosh kod të ri pas ${s} sekondash.`,
    resent: "Një kod i ri është në rrugë.",
    wrong: "Ky kod nuk është i saktë ose ka skaduar. Shiko email-in e fundit, ose kërko një kod të ri.",
    tooMany: "Shumë përpjekje. Prit pak dhe provo përsëri.",
    otherEmail: "Përdor një email tjetër",
  } satisfies typeof en,
};

/** "Enter the code we emailed you." Confirms a new account, then continues into Mind. */
export default function VerifyCode({ email, onBack, sendOnOpen = false }: { email: string; onBack: () => void; sendOnOpen?: boolean }) {
  const router = useRouter();
  const t = useCopy(COPY);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [wait, setWait] = useState(sendOnOpen ? 0 : RESEND_WAIT);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Coming from sign-in with an unverified account: send a fresh code straight away.
    if (sendOnOpen) resend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    const supabase = browserClient();
    const token = code.replace(/\s/g, "");
    // "email" is the current name for this code; older projects still call it "signup".
    let { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) ({ error } = await supabase.auth.verifyOtp({ email, token, type: "signup" }));
    setBusy(false);
    if (error) return setError(/rate|too many/i.test(error.message) ? t.tooMany : t.wrong);
    // Verified and signed in. New people go through the welcome steps from the home page.
    router.replace("/");
    router.refresh();
  }

  async function resend() {
    setError("");
    setNote("");
    const { error } = await browserClient().auth.resend({ type: "signup", email });
    setWait(RESEND_WAIT);
    if (error) return setError(/rate|too many|seconds/i.test(error.message) ? t.tooMany : t.wrong);
    setNote(t.resent);
  }

  return (
    <form onSubmit={verify} className="space-y-3">
      <p className="text-[15px] text-[#3b403c]">{t.intro(email)}</p>
      <label htmlFor="code" className={`${authLabel} pt-2`}>
        {t.label}
      </label>
      <input
        ref={inputRef}
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={10}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={t.placeholder}
        className={`${authField} text-center text-2xl tracking-[0.5em] placeholder:text-base placeholder:tracking-normal`}
      />
      {error && <p className="text-sm text-[#a0533a]">{error}</p>}
      {note && <p className="text-sm text-[#3f6b45]">{note}</p>}
      <button type="submit" disabled={busy || code.length < 6} className={authButton}>
        {busy ? t.verifying : t.verify}
      </button>
      <p className="pt-1 text-center text-sm text-[#6b736c]">
        {wait > 0 ? (
          t.resendIn(wait)
        ) : (
          <>
            {t.noCode}{" "}
            <button type="button" onClick={resend} className="text-[#111] underline-offset-2 hover:underline">
              {t.resend}
            </button>
          </>
        )}
      </p>
      <p className="text-center text-sm">
        <button type="button" onClick={onBack} className="text-[#6b736c] underline-offset-2 hover:underline">
          {t.otherEmail}
        </button>
      </p>
    </form>
  );
}
