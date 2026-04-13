import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = request.nextUrl;

  const country      = searchParams.get("country");
  const degreeLevel  = searchParams.get("degree_level");
  const fundingType  = searchParams.get("funding_type");
  const search       = searchParams.get("search");

  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (country      && country      !== "All") query = query.eq("country",      country);
  if (fundingType  && fundingType  !== "All") query = query.eq("funding_type", fundingType);
  if (degreeLevel  && degreeLevel  !== "All") query = query.contains("degree_levels", [degreeLevel]);
  if (search) query = query.or(
    `name.ilike.%${search}%,description.ilike.%${search}%,provider.ilike.%${search}%`
  );

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Admin-only: check role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { data, error } = await supabase.from("scholarships").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
