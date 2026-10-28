import { GuestLock } from "@/components/Guest";
import { isGuest, serverClient } from "@/lib/supabase/server";

// Guests see what this page is for and how to get it, instead of the page itself.
export default async function LettersLayout({ children }: { children: React.ReactNode }) {
  const { user } = await serverClient();
  if (isGuest(user)) return <GuestLock feature="letters" />;
  return children;
}
