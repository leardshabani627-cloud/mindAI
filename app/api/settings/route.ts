import { cleanPlan } from "@/lib/safetyPlan";
import { cleanContacts, cleanName, getSettings, saveSettings, type Settings } from "@/lib/settings";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  return Response.json(await getSettings(supabase));
}

// Body can contain any of: emergency_contacts, crisis_resources, safety_plan, display_name,
// acceptDisclaimer, finishOnboarding.
export async function PUT(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const changes: Partial<Settings> = {};

  for (const key of ["emergency_contacts", "crisis_resources"] as const) {
    if (body[key] === undefined) continue;
    const list = cleanContacts(body[key]);
    if (!list) return new Response("Invalid request.", { status: 400 });
    changes[key] = list;
  }
  if (body.safety_plan !== undefined) {
    if (isGuest(user)) return accountsOnly();
    const plan = cleanPlan(body.safety_plan);
    if (!plan) return new Response("Invalid request.", { status: 400 });
    changes.safety_plan = plan;
  }
  if (body.display_name !== undefined) {
    const name = cleanName(body.display_name);
    if (name === undefined) return new Response("Invalid request.", { status: 400 });
    changes.display_name = name;
  }
  if (body.acceptDisclaimer === true) changes.disclaimer_accepted_at = new Date().toISOString();
  if (body.finishOnboarding === true) changes.onboarded_at = new Date().toISOString();

  const ok = await saveSettings(supabase, user.id, changes);
  return new Response(null, { status: ok ? 204 : 500 });
}
