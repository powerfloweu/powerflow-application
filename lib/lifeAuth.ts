/**
 * Auth gate for the lifestyle beta: the caller must be signed in AND have
 * profiles.lifestyle_beta = true. Returns the user id or null.
 */
import { createClient } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

export async function requireLifeUser(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await dbSelect<{ lifestyle_beta: boolean }>("profiles", {
    id: `eq.${user.id}`,
    select: "lifestyle_beta",
  });
  return rows[0]?.lifestyle_beta ? user.id : null;
}
