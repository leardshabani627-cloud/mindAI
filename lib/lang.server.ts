import { cookies, headers } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/lang";

/** The language to render in: the saved choice, otherwise Albanian for Albanian browsers, else English. */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (saved === "en" || saved === "sq") return saved;
  const accepted = (await headers()).get("accept-language") ?? "";
  return accepted.trim().toLowerCase().startsWith("sq") ? "sq" : "en";
}
