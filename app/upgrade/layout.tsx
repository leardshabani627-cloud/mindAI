import { redirect } from "next/navigation";
import { isGuest, serverClient } from "@/lib/supabase/server";

// Only for guests: everyone else already has an account.
export default async function UpgradeLayout({ children }: { children: React.ReactNode }) {
  const { user } = await serverClient();
  if (!user) redirect("/login");
  if (!isGuest(user)) redirect("/");
  return children;
}
