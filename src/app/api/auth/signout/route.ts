import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = process.env.NEXT_PUBLIC_APP_URL 
    ? new URL("/", process.env.NEXT_PUBLIC_APP_URL)
    : "/";
  return NextResponse.redirect(url);
}
