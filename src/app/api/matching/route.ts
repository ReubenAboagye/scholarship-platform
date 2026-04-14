import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchScholarships, generateMatchExplanation } from "@/lib/ai/matching";
import { consumeCooldown } from "@/lib/security/rate-limit";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
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

  const cooldown = consumeCooldown(`matching:${user.id}`, 30_000);
  if (!cooldown.allowed) {
    return NextResponse.json(
      {
        error: "Please wait before running AI matching again.",
        retry_after_ms: cooldown.retryAfterMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(cooldown.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const results = await matchScholarships(profile, 10);
    let explanation: string | null = null;

    if (results.length > 0) {
      try {
        explanation = await generateMatchExplanation(
          results.map((r) => r.scholarship),
          profile
        );
      } catch (error) {
        console.error("Match explanation error:", error);
      }
    }

    return NextResponse.json({ data: { results, explanation } });
  } catch (err: any) {
    console.error("Matching error:", err);
    return NextResponse.json(
      { error: "AI matching failed. Please try again." },
      { status: 500 }
    );
  }
}
