import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS policy "profiles: any auth reads coaches" allows this
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("role", "coach")
    .order("display_name");

  return NextResponse.json(data ?? []);
}
