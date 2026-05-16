import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdminJson, requireSuperAdminJson, hasAal2 } from "@/lib/auth/admin";
import { readJsonBody } from "@/lib/server/body-size";

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/[id]
//
// Admin-only. Currently supports a single safe field: `role`,
// which can be changed between "user", "admin", and "super_admin".
//
// Privilege model:
//   - Any admin (admin or super_admin) can view/update most profile
//     fields through existing RLS.
//   - ONLY super_admin may mutate role.
//   - Self-modification is blocked at the API layer and again
//     by the BEFORE UPDATE trigger (trg_profiles_protect_fields).
//   - MFA (AAL2) is enforced both app-level (hasAal2) and in the
//     DB trigger so direct table updates cannot bypass it.
//     Supabase Auth MFA must be enabled in the dashboard for
//     this to be effective.
//   - Audit logging is best-effort via the API (enriched with IP
//     and user-agent). The DB trigger is the fail-closed layer
//     for role-change authorization.
//
// Deliberately scoped down:
//   - No PUT/DELETE here. Account deletion is a prohibited
//     action; suspension would need an audit trail we don't
//     have yet.
//   - No email or full_name edits — admins shouldn't be
//     rewriting users' identity from the console.
// ─────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_ROLES = ["user", "admin", "super_admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id } = await context.params;

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;
  const actor = adminCheck.user;

  // Block self-modification — see header comment.
  if (actor.id === id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  const bodyResult = await readJsonBody(request, 8_192);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  const role = (body as { role?: unknown })?.role;
  if (typeof role !== "string" || !ALLOWED_ROLES.includes(role as AllowedRole)) {
    return NextResponse.json(
      { error: `role must be one of ${ALLOWED_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Fetch the target user's current role before attempting any write.
  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", id)
    .maybeSingle();

  if (targetError) {
    console.error("Failed to fetch target user role", { targetId: id, error: targetError });
    return NextResponse.json(
      { error: "Failed to verify target user." },
      { status: 500 }
    );
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const oldRole = targetProfile.role;

  // No-op: role is already the requested value.
  if (oldRole === role) {
    return NextResponse.json({ data: { id, role } });
  }

  // Role mutations require super_admin.
  const superCheck = await requireSuperAdminJson(supabase);
  if (!superCheck.ok) return superCheck.response;

  // Enforce MFA for sensitive admin role changes.
  // NOTE: Supabase Auth MFA must be configured in the Supabase
  // dashboard (Enforce MFA = ON for admin roles) for this to
  // provide real protection.
  const mfaOk = await hasAal2(supabase);
  if (!mfaOk) {
    return NextResponse.json(
      { error: "Multi-factor authentication required for role changes." },
      { status: 403 }
    );
  }

  // Deliberately use the session-bound client for the write so
  // profiles RLS remains the data-layer guard. The route-level
  // super_admin check is still useful for clearer API behaviour, but
  // this mutation should also fail closed at the table policy.
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id, role")
    .single();

  if (error) {
    const isNotFound = error.code === "PGRST116";
    return NextResponse.json(
      { error: isNotFound ? "User not found" : "Failed to update user role." },
      { status: isNotFound ? 404 : 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Insert audit log via service_role so RLS on the audit table
  // does not block the write. The service_role key is never sent
  // to the browser; this happens server-side only.
  const adminClient = createAdminClient();
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const { error: auditError } = await adminClient.from("admin_role_audit_log").insert({
    actor_user_id: actor.id,
    target_user_id: id,
    old_role: oldRole,
    new_role: role,
    actor_email: actor.email ?? null,
    target_email: targetProfile.email ?? null,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (auditError) {
    // Log but do not fail the request; the role change already succeeded.
    console.error("Audit log insert failed", { actorId: actor.id, targetId: id, error: auditError });
  }

  return NextResponse.json({ data });
}
