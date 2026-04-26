/**
 * DELETE /api/admin/delete-user
 * Body: { userId: string }
 *
 * Auth: session email must match ADMIN_EMAIL env var.
 * Deletes the user from auth.users (cascade deletes profile + related rows).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { deleteAuthUser } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function verifyAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase() === adminEmail;
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId } = body;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const ok = await deleteAuthUser(userId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
