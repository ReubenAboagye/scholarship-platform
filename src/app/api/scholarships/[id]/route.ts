import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson, requireSuperAdminJson } from "@/lib/auth/admin";
import { resolveStudyFieldSlugs } from "@/lib/constants/study-fields";
import { scholarshipUpdateSchema } from "@/lib/validation/scholarship";
import { readJsonBody } from "@/lib/server/body-size";
import { checkSameOrigin } from "@/lib/server/csrf";
import { getClientIp } from "@/lib/auth/ip";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;
  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;
  const actor = adminCheck.user;

  const csrf = checkSameOrigin(request);
  if (csrf) return csrf;

  const bodyResult = await readJsonBody(request, 65_536);
  if (!bodyResult.ok) return bodyResult.response;

  // If this is a soft-delete or restore request, handle it separately
  const rawBody = bodyResult.data as Record<string, unknown>;
  const isSoftDelete = rawBody?.action === "soft_delete";
  const isRestore  = rawBody?.action === "restore";

  if (isSoftDelete || isRestore) {
    // Fetch current row for audit snapshot
    const { data: oldRow, error: fetchErr } = await supabase
      .from("scholarships")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !oldRow) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    const reason = typeof rawBody?.reason === "string" ? rawBody.reason : null;

    const updatePayload = isSoftDelete
      ? { deleted_at: new Date().toISOString(), deleted_by: actor.id, is_active: false }
      : { deleted_at: null, deleted_by: null, is_active: true };

    const { data: updated, error } = await supabase
      .from("scholarships")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Audit
    try {
      const ip = await getClientIp();
      const ua = request.headers.get("user-agent") ?? null;
      await supabase.rpc("log_scholarship_audit", {
        p_actor_user_id: actor.id,
        p_scholarship_id: id,
        p_action: isSoftDelete ? "soft_delete" : "update",
        p_old_snapshot: oldRow,
        p_new_snapshot: updated,
        p_reason: reason,
        p_ip_address: ip,
        p_user_agent: ua,
      });
    } catch (auditErr) {
      console.error("Scholarship soft-delete audit failed:", auditErr);
    }

    return NextResponse.json({ data: updated });
  }

  // Normal update
  const parsed = scholarshipUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scholarship payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch old snapshot for audit
  const { data: oldRow, error: fetchErr } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !oldRow) {
    return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
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

  // Audit
  try {
    const ip = await getClientIp();
    const ua = request.headers.get("user-agent") ?? null;
    await supabase.rpc("log_scholarship_audit", {
      p_actor_user_id: actor.id,
      p_scholarship_id: id,
      p_action: "update",
      p_old_snapshot: oldRow,
      p_new_snapshot: data,
      p_reason: null,
      p_ip_address: ip,
      p_user_agent: ua,
    });
  } catch (auditErr) {
    console.error("Scholarship update audit failed:", auditErr);
  }

  return NextResponse.json({ data });
}

// DELETE now performs a HARD delete and requires super_admin + reason.
// Admins should use PATCH { action: "soft_delete" } for normal removal.
export async function DELETE(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;

  const superCheck = await requireSuperAdminJson(supabase);
  if (!superCheck.ok) return superCheck.response;
  const actor = superCheck.user;

  const csrf = checkSameOrigin(request);
  if (csrf) return csrf;

  // Require a reason for hard deletes
  const bodyResult = await readJsonBody(request, 8_192);
  let reason: string | null = null;
  if (bodyResult.ok && typeof (bodyResult.data as any)?.reason === "string") {
    reason = (bodyResult.data as any).reason;
  }
  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: "A reason with at least 5 characters is required for hard deletion." },
      { status: 400 }
    );
  }

  // Fetch row for final audit snapshot
  const { data: oldRow, error: fetchErr } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !oldRow) {
    return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
  }

  const { error } = await supabase.from("scholarships").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  try {
    const ip = await getClientIp();
    const ua = request.headers.get("user-agent") ?? null;
    await supabase.rpc("log_scholarship_audit", {
      p_actor_user_id: actor.id,
      p_scholarship_id: id,
      p_action: "hard_delete",
      p_old_snapshot: oldRow,
      p_new_snapshot: null,
      p_reason: reason,
      p_ip_address: ip,
      p_user_agent: ua,
    });
  } catch (auditErr) {
    console.error("Scholarship hard-delete audit failed:", auditErr);
  }

  return NextResponse.json({ success: true });
}
