import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchScholarships, generateMatchExplanation } from "@/lib/ai/matching";

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (!profile)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (!profile.field_of_study && !profile.degree_level)
    return NextResponse.json(
      { error: "Complete your profile before running AI matching." },
      { status: 400 }
    );

  try {
    const results = await matchScholarships(profile, 10);
    const explanation = results.length > 0
      ? await generateMatchExplanation(results.map((r) => r.scholarship), profile)
      : null;

    return NextResponse.json({ data: { results, explanation } });
  } catch (err: any) {
    console.error("Matching error:", err);
    return NextResponse.json(
      { error: "AI matching failed. Please try again." },
      { status: 500 }
    );
  }
}
