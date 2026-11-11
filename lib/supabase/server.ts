import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server only. A Supabase client that acts as the signed-in user (from their cookies),
// so Row Level Security applies to every query. There is no service key in this app.
export async function serverClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called where cookies are read-only; the proxy refreshes the session instead.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export const unauthorized = () => new Response("Unauthorized", { status: 401 });

/** Someone trying Mind without an account (Supabase anonymous sign-in). */
export const isGuest = (user: User | null) => user?.is_anonymous === true;

/** For features that need a free account: journal, mood, memories, letters. */
export const accountsOnly = () => new Response("This needs a free account.", { status: 403 });
