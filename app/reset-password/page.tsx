"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authButton, authField } from "@/components/AuthShell";
import { browserClient } from "@/lib/supabase/browser";
import { useCopy } from "@/lib/i18n";

const en = {
  title: "Choose a new password",
  subtitle: "Then you're back in.",
  placeholder: (n: number) => `New password (${n}+ characters)`,
  saving: "Saving…",
  save: "Save and continue",
  tooShort: (n: number) => `Please use at least ${n} characters.`,
  failed: "Couldn't change the password. Please ask for a new link and try again.",
  newTitle: "Choose your password",
  newSubtitle: "Your email is confirmed and your account is ready. One last step.",
  newPlaceholder: (n: number) => `Password (${n}+ characters)`,
  newFailed: "Couldn't save the password. Please try again.",
};
const COPY = {
  en,
  sq: {
    title: "Zgjidh një fjalëkalim të ri",
    subtitle: "Pastaj je sërish brenda.",
    placeholder: (n: number) => `Fjalëkalimi i ri (${n}+ shkronja)`,
    saving: "Po ruhet…",
    save: "Ruaj dhe vazhdo",
    tooShort: (n: number) => `Përdor të paktën ${n} shkronja.`,
    failed: "Fjalëkalimi nuk u ndryshua. Kërko një link të ri dhe provo përsëri.",
    newTitle: "Zgjidh fjalëkalimin tënd",
    newSubtitle: "Email-i u konfirmua dhe llogaria është gati. Edhe një hap.",
    newPlaceholder: (n: number) => `Fjalëkalimi (${n}+ shkronja)`,
    newFailed: "Fjalëkalimi nuk u ruajt. Provo përsëri.",
  } satisfies typeof en,
};

const MIN_PASSWORD = 8;

// Reached from the reset email (already signed in by /auth/callback): choose a new password.
// With ?new=1 it's the last step for a guest who just made an account: choose their first password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useCopy(COPY);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setIsNew(new URLSearchParams(location.search).get("new") === "1");
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(t.tooShort(MIN_PASSWORD));
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(isNew ? t.newFailed : t.failed);
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthShell title={isNew ? t.newTitle : t.title} subtitle={isNew ? t.newSubtitle : t.subtitle}>
      <form onSubmit={save} className="space-y-3">
        <input
          type="password"
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isNew ? t.newPlaceholder(MIN_PASSWORD) : t.placeholder(MIN_PASSWORD)}
          className={authField}
        />
        {error && <p className="text-sm text-[var(--muted)]">{error}</p>}
        <button type="submit" disabled={busy} className={authButton}>
          {busy ? t.saving : t.save}
        </button>
      </form>
    </AuthShell>
  );
}
