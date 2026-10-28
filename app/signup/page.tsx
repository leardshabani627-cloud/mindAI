"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authButton, authField, authLink, OrDivider } from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";
import VerifyCode from "@/components/VerifyCode";
import { browserClient } from "@/lib/supabase/browser";
import { useCopy } from "@/lib/i18n";

const en = {
  title: "Create your space",
  subtitle: "Private, just for you.",
  email: "Email",
  password: (n: number) => `Password (${n}+ characters)`,
  show: "Show",
  hide: "Hide",
  adult: "I'm 16 or older.",
  understand:
    "I understand Mind is an AI companion, not a therapist or emergency service. In danger, I'll contact my local emergency number.",
  creating: "Creating…",
  create: "Create account",
  haveAccount: "Already have an account?",
  or: "or",
  signIn: "Sign in",
  checkTitle: "Check your email",
  checkSubtitle: "One more step.",
  tooShort: (n: number) => `Please use at least ${n} characters for your password.`,
  exists: "There's already an account with this email. Try signing in.",
  closed: "New accounts aren't open right now.",
  failed: "Couldn't create the account. Please try again.",
};
const COPY = {
  en,
  sq: {
    title: "Krijo hapësirën tënde",
    subtitle: "Private, vetëm për ty.",
    email: "Email-i",
    password: (n: number) => `Fjalëkalimi (${n}+ shkronja)`,
    show: "Shfaq",
    hide: "Fshih",
    adult: "Jam 16 vjeç ose më i madh.",
    understand:
      "E kuptoj që Mind është një shoqërues AI, jo terapist apo shërbim urgjence. Në rrezik, do të kontaktoj numrin lokal të urgjencës.",
    creating: "Po krijohet…",
    create: "Krijo llogarinë",
    haveAccount: "Ke tashmë një llogari?",
    or: "ose",
    signIn: "Hyr",
    checkTitle: "Shiko email-in",
    checkSubtitle: "Edhe një hap.",
    tooShort: (n: number) => `Përdor të paktën ${n} shkronja për fjalëkalimin.`,
    exists: "Ekziston tashmë një llogari me këtë email. Provo të hysh.",
    closed: "Llogaritë e reja nuk janë të hapura tani.",
    failed: "Llogaria nuk u krijua. Provo përsëri.",
  } satisfies typeof en,
};

const MIN_PASSWORD = 8;

// Create an account. If the project asks for email confirmation, the link in the email
// brings people back through /auth/callback and on to the welcome steps.
export default function SignupPage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adult, setAdult] = useState(false);
  const [understands, setUnderstands] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(t.tooShort(MIN_PASSWORD));
    setBusy(true);
    setError("");
    const { data, error } = await browserClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/welcome` },
    });
    setBusy(false);
    if (error) {
      return setError(
        /registered|exists/i.test(error.message)
          ? t.exists
          : /signups? (are )?not allowed|disabled/i.test(error.message)
            ? t.closed
            : t.failed,
      );
    }
    if (data.session) {
      // Email confirmation is switched off: straight to the welcome steps.
      router.replace("/welcome");
      router.refresh();
    } else {
      setSentTo(email);
    }
  }

  if (sentTo) {
    return (
      <AuthShell title={t.checkTitle} subtitle={t.checkSubtitle}>
        {/* The account stays unverified until the code from the email is entered here. */}
        <VerifyCode email={sentTo} onBack={() => setSentTo("")} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <form onSubmit={signUp} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className={authField}
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
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

        <label className="flex items-start gap-3 pt-1 text-sm text-[#3b403c]">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 accent-[#111]" />
          <span>{t.adult}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-[#3b403c]">
          <input
            type="checkbox"
            checked={understands}
            onChange={(e) => setUnderstands(e.target.checked)}
            className="mt-1 accent-[#111]"
          />
          <span>{t.understand}</span>
        </label>

        {error && <p className="text-sm text-[var(--muted)]">{error}</p>}
        <button type="submit" disabled={busy || !adult || !understands} className={authButton}>
          {busy ? t.creating : t.create}
        </button>
      </form>

      <OrDivider label={t.or} />
      {/* Google also needs the two promises above ticked first. */}
      <GoogleButton disabled={!adult || !understands} />

      <p className="mt-8 text-center text-sm text-[#8a8f8a]">
        {t.haveAccount}{" "}
        <Link href="/login" className={authLink}>
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}
