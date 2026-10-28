"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell, { authButton, authField } from "@/components/AuthShell";
import { browserClient } from "@/lib/supabase/browser";
import { useCopy } from "@/lib/i18n";

const en = {
  title: "Forgot your password?",
  subtitle: "We'll email you a link to choose a new one.",
  sent: (email: string) => `If there's an account for ${email}, a reset link is on its way. Check your spam folder too.`,
  email: "Your email",
  sending: "Sending…",
  send: "Send reset link",
  back: "Back to sign in",
  tooMany: "Too many tries. Please wait a few minutes.",
};
const COPY = {
  en,
  sq: {
    title: "Ke harruar fjalëkalimin?",
    subtitle: "Do të të dërgojmë një link për të zgjedhur një të ri.",
    sent: (email: string) => `Nëse ka një llogari për ${email}, linku për ta ndryshuar është në rrugë. Shiko edhe te spam-i.`,
    email: "Email-i yt",
    sending: "Po dërgohet…",
    send: "Dërgo linkun",
    back: "Kthehu te hyrja",
    tooMany: "Shumë përpjekje. Prit disa minuta.",
  } satisfies typeof en,
};

// Sends a reset link. The link signs you in through /auth/callback and opens /reset-password.
export default function ForgotPasswordPage() {
  const t = useCopy(COPY);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Same message whether or not the email has an account, so nobody can check who uses Mind.
    if (error && /rate|too many/i.test(error.message)) return setError(t.tooMany);
    setSent(true);
  }

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      {sent ? (
        <p className="text-center">{t.sent(email)}</p>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email}
            className={authField}
          />
          {error && <p className="text-sm text-[var(--muted)]">{error}</p>}
          <button type="submit" disabled={busy} className={authButton}>
            {busy ? t.sending : t.send}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-[var(--muted)] hover:text-[var(--fg)]">
          {t.back}
        </Link>
      </p>
    </AuthShell>
  );
}
