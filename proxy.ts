import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open. Everything else needs a login.
const SIGNED_OUT_ONLY = ["/login", "/signup", "/forgot-password"];
const PUBLIC_PATHS = [...SIGNED_OUT_ONLY, "/auth/callback"];

// Runs before every page and API call: keeps the login session fresh and
// sends anyone who isn't signed in to /login (API calls get a 401).
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

  return response;
}

export const config = {
  // Pages and API routes need a login; public images (e.g. companion photos) don't.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg)$).*)"],
};
