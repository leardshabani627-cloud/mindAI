import { NextResponse, type NextRequest } from "next/server";
import { safePath } from "@/lib/safePath";
import { serverClient } from "@/lib/supabase/server";

// Where links in Supabase emails land (confirm your email, reset your password).
// Turns the one-time code into a signed-in session, then continues to `next`.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Only ever continue to a page of this app (never to another site).
  const safeNext = safePath(request.nextUrl.searchParams.get("next"));

  if (code) {
    const { supabase } = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
    console.error("auth callback failed:", error.message);
  }
  // Expired or already-used link.
  return NextResponse.redirect(new URL("/login?link=expired", request.url));
}
