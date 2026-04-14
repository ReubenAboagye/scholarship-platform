import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson } from "@/lib/auth/admin";
import { scholarshipCreateSchema } from "@/lib/validation/scholarship";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
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
  const supabase = await createClient();

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const parsed = scholarshipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scholarship payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("scholarships")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
