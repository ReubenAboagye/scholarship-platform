import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson } from "@/lib/auth/admin";
import { resolveStudyFieldSlugs } from "@/lib/constants/study-fields";
import { scholarshipUpdateSchema } from "@/lib/validation/scholarship";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;
  const { data, error } = await supabase
    .from("scholarships").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const parsed = scholarshipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scholarship payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = {
    ...parsed.data,
    ...(parsed.data.fields_of_study
      ? { study_field_slugs: resolveStudyFieldSlugs(parsed.data.fields_of_study) }
      : {}),
  };

  const { data, error } = await supabase
    .from("scholarships")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  const { error } = await supabase.from("scholarships").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
