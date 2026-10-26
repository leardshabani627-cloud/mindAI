"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

// Sign-in only. There is no sign-up: create your own user in the Supabase dashboard
// (Authentication > Users > Add user) so nobody else can make an account.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("That email or password didn't work.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const field =
    "w-full rounded-2xl glass px-4 py-3 outline-none placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-center text-2xl tracking-wide">Mind</h1>
      <p className="mb-8 text-center text-[var(--muted)]">A private space to talk.</p>
      <form onSubmit={signIn} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={field}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={field}
        />
        {error && <p className="text-[var(--muted)]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)] disabled:opacity-40"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
