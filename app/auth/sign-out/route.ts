import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL("/auth/sign-in", process.env.NEXT_PUBLIC_SUPABASE_URL ? `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0]}.vercel.app` : "http://localhost:3000")
  );
}

// Support GET for simple href-based sign-out links
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
