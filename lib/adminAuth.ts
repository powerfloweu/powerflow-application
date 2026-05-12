/**
 * Shared admin authentication helper for API routes.
 *
 * Usage:
 *   import { requireAdmin } from "@/lib/adminAuth";
 *   if (!await requireAdmin()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
 */

import { createClient, isConfigured } from "@/lib/supabase/server";

/**
 * Returns true when the current Supabase session belongs to the admin email
 * configured in the ADMIN_EMAIL environment variable.
 */
export async function requireAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase().trim() === adminEmail;
}
