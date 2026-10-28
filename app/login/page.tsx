"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authButton, authField, authLabel, authLink, OrDivider } from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";
import GuestButton from "@/components/GuestButton";
import VerifyCode from "@/components/VerifyCode";
import { useCopy } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";

const en = {
  title: "Welcome back",
  verifyTitle: "Verify your email",
  emailQuestion: "What's your email?",
  email: "Enter your email",
  continue: "Continue",
  passwordFor: "Password for",
  change: "Change",
  password: "Password",
  signingIn: "Signing in…",
  signIn: "Sign in",
  or: "or",
  forgot: "Forgot password?",
  noAccount: "Don't have an account?",
  register: "Register",
  expired: "That link has expired or was already used. Sign in, or ask for a new link.",
  wrong: "That email or password didn't work.",
};
const COPY = {
  en,
  sq: {
    title: "Mirë se u ktheve",
    verifyTitle: "Verifiko email-in",
    emailQuestion: "Cili është email-i yt?",
    email: "Shkruaj email-in",
    continue: "Vazhdo",
    passwordFor: "Fjalëkalimi për",
    change: "Ndrysho",
    password: "Fjalëkalimi",
    signingIn: "Po hyn…",
    signIn: "Hyr",
    or: "ose",
    forgot: "Ke harruar fjalëkalimin?",
    noAccount: "Nuk ke llogari?",
    register: "Regjistrohu",
    expired: "Ky link ka skaduar ose është përdorur. Hyr, ose kërko një link të ri.",
    wrong: "Email-i ose fjalëkalimi nuk është i saktë.",
  } satisfies typeof en,
};

// Two calm steps, like the design: your email, then your password.
export default function LoginPage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false); // signed up but never entered the email code
  const passwordRef = useRef<HTMLInputElement>(null);

  // Came back from an old or already-used email link.
  useEffect(() => {
    if (new URLSearchParams(location.search).get("link") === "expired") setError(t.expired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  function toPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("password");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      if (error.message.toLowerCase().includes("confirm")) return setNeedsCode(true);
      setError(t.wrong);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (needsCode) {
    return (
      <AuthShell title={t.verifyTitle}>
        <VerifyCode email={email} sendOnOpen onBack={() => setNeedsCode(false)} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.title}>
      {step === "email" ? (
        <form onSubmit={toPassword} className="space-y-3">
          <label htmlFor="email" className={authLabel}>
            {t.emailQuestion}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email}
            className={authField}
          />
          {error && <p className="text-sm text-[#6b736c]">{error}</p>}
          <button type="submit" className={authButton}>
            {t.continue}
          </button>
        </form>
      ) : (
        <form onSubmit={signIn} className="space-y-3">
          <p className={authLabel}>
            {t.passwordFor} <span className="font-medium">{email}</span>{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setError("");
              }}
              className="text-[15px] text-[#6b736c] underline-offset-2 hover:underline"
            >
              {t.change}
            </button>
          </p>
          <input
            ref={passwordRef}
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.password}
            className={authField}
          />
          {error && <p className="text-sm text-[#6b736c]">{error}</p>}
          <button type="submit" disabled={busy} className={authButton}>
            {busy ? t.signingIn : t.signIn}
          </button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-[#6b736c] underline-offset-2 hover:underline">
              {t.forgot}
            </Link>
          </p>
        </form>
      )}

      <OrDivider label={t.or} />
      <GoogleButton />
      <GuestButton />

      <p className="mt-8 text-center text-sm text-[#8a8f8a]">
        {t.noAccount}{" "}
        <Link href="/signup" className={authLink}>
          {t.register}
        </Link>
      </p>
    </AuthShell>
  );
}
