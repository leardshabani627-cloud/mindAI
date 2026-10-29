import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UNLOCK_COOKIE, isUnlocked, justSignedIn, lockConfigured, lockSettings, unlockCookieOptions, unlockToken } from "@/lib/appLock";

// Pages anyone can open. Everything else needs a login.
const SIGNED_OUT_ONLY = ["/login", "/signup", "/forgot-password"];
const PUBLIC_PATHS = [...SIGNED_OUT_ONLY, "/auth/callback"];
// Reachable while the app lock is showing: the lock screen itself, unlocking, and locking.
const LOCK_PATHS = ["/lock", "/api/lock/unlock", "/api/lock/now"];

// Runs before every page and API call: keeps the login session fresh, sends anyone who isn't
// signed in to /login (API calls get a 401), and shows the PIN screen when the app lock is on.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && !PUBLIC_PATHS.includes(path)) {
    if (path.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && SIGNED_OUT_ONLY.includes(path)) return NextResponse.redirect(new URL("/", request.url));

  // App lock.
  const lock = lockSettings(user);
  if (path === "/lock" && !lock.enabled) return NextResponse.redirect(new URL("/", request.url));
  if (user && lock.enabled && lockConfigured() && !PUBLIC_PATHS.includes(path)) {
    // Keeps the session cookies Supabase may just have refreshed.
    const keepCookies = (res: NextResponse) => {
      response.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    };
    const unlocked = (await isUnlocked(request.cookies.get(UNLOCK_COOKIE)?.value, user.id)) || justSignedIn(user);

    if (unlocked) {
      if (path === "/lock") {
        const next = request.nextUrl.searchParams.get("next") ?? "/";
        return keepCookies(NextResponse.redirect(new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/", request.url)));
      }
      // Still active: the lock waits another full stretch from now.
      response.cookies.set(UNLOCK_COOKIE, await unlockToken(user.id, lock.minutes), unlockCookieOptions);
      return response;
    }

    if (!LOCK_PATHS.includes(path)) {
      if (path.startsWith("/api/")) return keepCookies(new NextResponse("Locked", { status: 423 }));
      const to = new URL("/lock", request.url);
      to.searchParams.set("next", path);
      return keepCookies(NextResponse.redirect(to));
    }
  }

  return response;
}

export const config = {
  // Pages and API routes need a login; public images, the service worker and icons don't.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:png|jpg|jpeg|webp|svg)$).*)"],
};
