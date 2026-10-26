import { createBrowserClient } from "@supabase/ssr";

// Browser client, used only for signing in and out. The anon key is public by design:
// Row Level Security is what protects the data.
export const browserClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
