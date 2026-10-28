"use client";

import Link from "next/link";
import AuthShowcase from "@/components/AuthShowcase";
import LanguageSwitch from "@/components/LanguageSwitch";
import Scenery from "@/components/Scenery";
import Wordmark from "@/components/Wordmark";

// Sign in, sign up and password pages: a white panel with the form on the left,
// and a preview of Mind over the hills on the right (wide screens).
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh sm:p-5 lg:p-8">
      {/* A green meadow all around the card: the hills, with the sky tinted green so no edge is left white. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <Scenery contained />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(124,158,104,0.85)_0%,rgba(150,182,128,0.55)_40%,rgba(60,96,58,0.25)_75%,rgba(31,59,44,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(25,50,32,0.35)_100%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1380px] overflow-hidden bg-white sm:rounded-[1.75rem] sm:shadow-[0_40px_100px_-40px_rgba(15,40,20,0.65)] lg:grid-cols-[1fr_1.05fr]">
        <section className="flex min-h-dvh flex-col px-6 py-6 sm:min-h-0 sm:px-10 sm:py-8 lg:px-14">
          <header className="flex items-center justify-between">
            <Link href="/login" aria-label="Mind">
              <Wordmark className="text-3xl" />
            </Link>
            <LanguageSwitch />
          </header>

          <div className="mx-auto flex w-full max-w-[22rem] flex-1 flex-col justify-center py-10">
            <div className="mb-8 text-center">
              <Wordmark className="text-5xl" />
              <h1 className="mt-3 text-2xl tracking-tight text-[#111]">{title}</h1>
              {subtitle && <p className="mt-1 text-[15px] text-[#6b736c]">{subtitle}</p>}
            </div>
            {children}
          </div>
        </section>

        <AuthShowcase />
      </div>
    </main>
  );
}

// Shared form styles, matched to the sign-in design: soft grey fields, black main button.
export const authLabel = "mb-2 block text-[1.05rem] leading-snug text-[#111]";
export const authField =
  "w-full rounded-lg bg-[#f1f2f0] px-4 py-3 text-[15px] text-[#111] outline-none placeholder:text-[#8a8f8a] focus:ring-2 focus:ring-[#1f3b2c]/25";
export const authButton =
  "w-full rounded-lg bg-[#111] px-5 py-3 text-[15px] font-medium text-white transition hover:bg-black disabled:opacity-40";
export const authSecondary =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-[#ececea] px-5 py-3 text-[15px] font-medium text-[#111] transition hover:bg-[#e2e3e0] disabled:opacity-40";
export const authLink = "text-[#111] underline-offset-2 hover:underline";

/** The thin line with "or" in the middle. */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-[#8a8f8a]">
      <span className="h-px flex-1 bg-[#d9dcd7]" />
      {label}
      <span className="h-px flex-1 bg-[#d9dcd7]" />
    </div>
  );
}
