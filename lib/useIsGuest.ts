"use client";

import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

/**
 * True for someone trying Mind without an account, false for an account, null until known.
 * Only for what the screen shows: the server and the database enforce the real limits.
 */
export function useIsGuest() {
  const [guest, setGuest] = useState<boolean | null>(null);
  useEffect(() => {
    browserClient()
      .auth.getSession()
      .then(({ data }) => setGuest(data.session?.user.is_anonymous === true));
  }, []);
  return guest;
}
