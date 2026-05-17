import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/server/body-size";
import { checkSameOrigin } from "@/lib/server/csrf";
import { z } from "zod";
import { resolveStudyFieldSlug } from "@/lib/constants/study-fields";

// ─────────────────────────────────────────────────────────────
// GET /api/profile
//
// Returns the current authenticated user's profile row.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, country_of_origin, field_of_study, primary_field_slug, degree_level, gpa, bio, avatar_url, role, citizenship, career_goals, financial_need, interests, notification_preferences, created_at, updated_at"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/profile
//
// Authenticated users may update their own profile.
// Server-side Zod validation prevents garbage / oversized data.
// The user's id is taken from the JWT, not the request body.
// ─────────────────────────────────────────────────────────────

const profilePatchSchema = z.object({
  full_name: z.string().trim().max(100).nullable().optional(),
  country_of_origin: z.string().trim().max(100).nullable().optional(),
  field_of_study: z.string().trim().max(100).nullable().optional(),
  degree_level: z
    .union([
      z.enum(["Undergraduate", "Masters", "PhD", "Any"]),
      z.null(),
      z.literal(""),
    ])
    .optional(),
  gpa: z
    .union([z.number().min(0).max(4), z.null(), z.literal("")])
    .optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  citizenship: z.string().trim().max(100).nullable().optional(),
  career_goals: z.string().trim().max(1000).nullable().optional(),
  financial_need: z.boolean().nullable().optional(),
  interests: z.array(z.string().trim().max(50)).max(10).optional(),
  notification_preferences: z
    .object({
      digest_email: z.boolean().optional(),
      deadline_reminders: z.boolean().optional(),
    })
    .optional(),
});

type ProfilePatchInput = z.infer<typeof profilePatchSchema>;

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrf = checkSameOrigin(request);
  if (csrf) return csrf;

  const bodyResult = await readJsonBody<ProfilePatchInput>(request, 65_536);
  if (!bodyResult.ok) return bodyResult.response;

  const parse = profilePatchSchema.safeParse(bodyResult.data);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parse.data;

  // Build the update payload, normalizing empty strings to null
  const updatePayload: Record<string, unknown> = {};

  if (input.full_name !== undefined) {
    updatePayload.full_name = input.full_name || null;
  }
  if (input.country_of_origin !== undefined) {
    updatePayload.country_of_origin = input.country_of_origin || null;
  }
  if (input.field_of_study !== undefined) {
    updatePayload.field_of_study = input.field_of_study || null;
    updatePayload.primary_field_slug = resolveStudyFieldSlug(input.field_of_study) ?? null;
  }
  if (input.degree_level !== undefined) {
    updatePayload.degree_level = input.degree_level === "" ? null : input.degree_level;
  }
  if (input.gpa !== undefined) {
    updatePayload.gpa = input.gpa === "" || input.gpa === null ? null : Number(input.gpa);
  }
  if (input.bio !== undefined) {
    updatePayload.bio = input.bio || null;
  }
  if (input.citizenship !== undefined) {
    updatePayload.citizenship = input.citizenship || null;
  }
  if (input.career_goals !== undefined) {
    updatePayload.career_goals = input.career_goals || null;
  }
  if (input.financial_need !== undefined) {
    updatePayload.financial_need = input.financial_need;
  }
  if (input.interests !== undefined) {
    updatePayload.interests = input.interests;
  }
  if (input.notification_preferences !== undefined) {
    updatePayload.notification_preferences = input.notification_preferences;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
