"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authButton, authField, authLabel, authLink } from "@/components/AuthShell";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const RESEND_WAIT = 60; // seconds before the email can be sent again
const MIN_PASSWORD = 8;

const en = {
  title: "Keep your space",
  subtitle: "A free account. Your chats, companion and settings stay with you.",
  email: "Your email",
  sending: "Sending…",
  send: "Continue",
  unlocks: "With an account: your journal, mood check-ins, memories, weekly letters and safety plan, and no daily limit.",
  back: "Not now, back to Mind",
  checkTitle: "Check your email",
  checkSubtitle: "One more step.",
  sentTo: (email: string) => `We sent a code to ${email}. Enter it below.`,
  codeLabel: "Code from the email",
  codePlaceholder: "Enter the code",
  verifying: "Checking…",
  verify: "Continue",
  wrongCode: "That code isn't right, or it has expired. Check the latest email, or send a new one.",
  noEmail: "Didn't get it? Check your spam folder, or",
  resend: "send it again",
  resendIn: (s: number) => `You can send it again in ${s}s.`,
  resent: "A new email is on its way.",
  otherEmail: "Use a different email",
  passwordTitle: "Choose your password",
  passwordSubtitle: "Your email is confirmed. Last step.",
  password: (n: number) => `Password (${n}+ characters)`,
  show: "Show",
  hide: "Hide",
  saving: "Saving…",
  finish: "Finish",
  tooShort: (n: number) => `Please use at least ${n} characters.`,
  passwordFailed: "Couldn't save the password. Please try again.",
  exists: "There's already an account with this email.",
  existsHint: "To use it, leave this guest visit in Settings and sign in. This guest visit stays separate.",
  tooMany: "Too many tries. Please wait a minute and try again.",
  failed: "Couldn't send the email. Please try again.",
};
const COPY = {
  en,
  sq: {
    title: "Ruaje hapësirën tënde",
    subtitle: "Një llogari falas. Bisedat, shoqëruesi dhe cilësimet mbeten me ty.",
    email: "Email-i yt",
    sending: "Po dërgohet…",
    send: "Vazhdo",
    unlocks: "Me llogari: ditari, regjistrimi i gjendjes, kujtesa, letrat e javës dhe plani i sigurisë, pa kufi ditor.",
    back: "Jo tani, kthehu te Mind",
    checkTitle: "Shiko email-in",
    checkSubtitle: "Edhe një hap.",
    sentTo: (email: string) => `Të dërguam një kod në ${email}. Shkruaje më poshtë.`,
    codeLabel: "Kodi nga email-i",
    codePlaceholder: "Shkruaj kodin",
    verifying: "Po kontrollohet…",
    verify: "Vazhdo",
    wrongCode: "Ky kod nuk është i saktë ose ka skaduar. Shiko email-in e fundit, ose dërgo një të ri.",
    noEmail: "S'të erdhi? Shiko te spam-i, ose",
    resend: "dërgoje përsëri",
    resendIn: (s: number) => `Mund ta dërgosh përsëri pas ${s} sekondash.`,
    resent: "Një email i ri është në rrugë.",
    otherEmail: "Përdor një email tjetër",
    passwordTitle: "Zgjidh fjalëkalimin tënd",
    passwordSubtitle: "Email-i u konfirmua. Hapi i fundit.",
    password: (n: number) => `Fjalëkalimi (${n}+ shkronja)`,
    show: "Shfaq",
    hide: "Fshih",
    saving: "Po ruhet…",
    finish: "Përfundo",
    tooShort: (n: number) => `Përdor të paktën ${n} shkronja.`,
    passwordFailed: "Fjalëkalimi nuk u ruajt. Provo përsëri.",
    exists: "Ekziston tashmë një llogari me këtë email.",
    existsHint: "Për ta përdorur, dil nga kjo vizitë te Cilësimet dhe hyr. Kjo vizitë si mysafir mbetet e veçantë.",
    tooMany: "Shumë përpjekje. Prit një minutë dhe provo përsëri.",
    failed: "Email-i nuk u dërgua. Provo përsëri.",
  } satisfies typeof en,
};

// A guest becomes a real account: same user, same data. Supabase emails a code ("Change email address"
// template); once it's entered they choose a password (Supabase only allows one after the email is confirmed).
// If the email has a link instead, the link works too: /auth/callback → /reset-password?new=1.
export default function UpgradePage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [exists, setExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  useEffect(() => {
    if (sentTo) codeRef.current?.focus();
  }, [sentTo]);

  // Sends (or sends again) the email with the code.
  async function sendCode(address: string) {
    setBusy(true);
    setError("");
    setNote("");
    setExists(false);
    const next = encodeURIComponent("/reset-password?new=1");
    const { error } = await browserClient().auth.updateUser(
      { email: address },
      { emailRedirectTo: `${location.origin}/auth/callback?next=${next}` },
    );
    setBusy(false);
    if (error) {
      if (/registered|exists|already/i.test(error.message)) return setExists(true);
      return setError(/rate|too many|seconds/i.test(error.message) ? t.tooMany : t.failed);
    }
    setWait(RESEND_WAIT);
    if (sentTo) setNote(t.resent);
    setSentTo(address);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    const { error } = await browserClient().auth.verifyOtp({ email: sentTo, token: code, type: "email_change" });
    setBusy(false);
    if (error) return setError(/rate|too many/i.test(error.message) ? t.tooMany : t.wrongCode);
    setConfirmed(true);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(t.tooShort(MIN_PASSWORD));
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(t.passwordFailed);
    router.replace("/");
    router.refresh();
  }

  if (confirmed) {
    return (
      <AuthShell title={t.passwordTitle} subtitle={t.passwordSubtitle}>
        <form onSubmit={savePassword} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoFocus
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password(MIN_PASSWORD)}
              className={`${authField} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#6b736c] hover:text-[#111]"
            >
              {showPassword ? t.hide : t.show}
            </button>
          </div>
          {error && <p className="text-sm text-[#a0533a]">{error}</p>}
          <button type="submit" disabled={busy} className={authButton}>
            {busy ? t.saving : t.finish}
          </button>
        </form>
      </AuthShell>
    );
  }

  if (sentTo) {
    return (
      <AuthShell title={t.checkTitle} subtitle={t.checkSubtitle}>
        <form onSubmit={verify} className="space-y-3">
          <p className="text-[15px] text-[#3b403c]">{t.sentTo(sentTo)}</p>
          <label htmlFor="code" className={`${authLabel} pt-2`}>
            {t.codeLabel}
          </label>
          <input
            ref={codeRef}
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={t.codePlaceholder}
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
                {t.noEmail}{" "}
                <button type="button" onClick={() => sendCode(sentTo)} disabled={busy} className="text-[#111] underline-offset-2 hover:underline">
                  {t.resend}
                </button>
              </>
            )}
          </p>
          <p className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setSentTo("");
                setCode("");
                setError("");
              }}
              className="text-[#6b736c] underline-offset-2 hover:underline"
            >
              {t.otherEmail}
            </button>
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendCode(email.trim());
        }}
        className="space-y-3"
      >
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className={authField}
        />
        {exists && (
          <p className="text-sm text-[#a0533a]">
            {t.exists} <span className="text-[#6b736c]">{t.existsHint}</span>
          </p>
        )}
        {error && <p className="text-sm text-[#a0533a]">{error}</p>}
        <button type="submit" disabled={busy} className={authButton}>
          {busy ? t.sending : t.send}
        </button>
      </form>

      <p className="mt-5 rounded-lg bg-[#f1f5ee] px-4 py-3 text-sm text-[#3b403c]">{t.unlocks}</p>

      <p className="mt-8 text-center text-sm">
        <Link href="/" className={`${authLink} text-[#6b736c]`}>
          {t.back}
        </Link>
      </p>
    </AuthShell>
  );
}
