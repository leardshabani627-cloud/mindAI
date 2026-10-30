// Where to go after signing in or unlocking, taken from the address (?next=...). Shared by browser and server.

/**
 * Only ever a page of this site ("/settings"), never another site. Browsers read "\" like "/" and skip tabs
 * and line breaks, so "/\evil.example" or "/\t/evil.example" would otherwise leave the site.
 */
export function safePath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\s]/.test(next)) return "/";
  try {
    const url = new URL(next, "http://mind.invalid");
    return url.origin === "http://mind.invalid" ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
