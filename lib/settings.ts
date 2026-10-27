import type { SupabaseClient } from "@supabase/supabase-js";
import type { SafetyPlan } from "@/lib/safetyPlan";

// Server only. Emergency contacts and crisis resources are entered by the user in Settings.
// Nothing is hardcoded: every name and number comes from them.

export type Contact = { name: string; detail: string };

export type Settings = {
  emergency_contacts: Contact[];
  crisis_resources: Contact[];
  disclaimer_accepted_at: string | null;
  safety_plan: SafetyPlan;
};

const MAX_ITEMS = 10;

export const emptySettings: Settings = {
  emergency_contacts: [],
  crisis_resources: [],
  disclaimer_accepted_at: null,
  safety_plan: {},
};

export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("emergency_contacts, crisis_resources, disclaimer_accepted_at, safety_plan")
    .maybeSingle();
  if (error) console.error("getSettings failed:", error.message);
  return data ?? emptySettings;
}

/** Returns a clean list, or null if the input isn't a list of { name, detail } strings. */
export function cleanContacts(value: unknown): Contact[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  const out: Contact[] = [];
  for (const item of value) {
    if (!item || typeof item.name !== "string" || typeof item.detail !== "string") return null;
    const name = item.name.trim().slice(0, 80);
    const detail = item.detail.trim().slice(0, 120);
    if (name || detail) out.push({ name, detail });
  }
  return out;
}

export async function saveSettings(supabase: SupabaseClient, userId: string, changes: Partial<Settings>) {
  // Only the columns in `changes` are updated; the rest keep their values.
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...changes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error("saveSettings failed:", error.message);
  return !error;
}
