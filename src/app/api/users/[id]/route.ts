import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson } from "@/lib/auth/admin";

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/[id]
//
// Admin-only. Currently supports a single safe field: `role`,
// which can be flipped between "user" and "admin".
//
// Deliberately scoped down:
//   - No PUT/DELETE here. Account deletion is a prohibited
//     action; suspension would need an audit trail we don't
//     have yet.
//   - No email or full_name edits — admins shouldn't be
//     rewriting users' identity from the console.
//   - Self-demotion is blocked. If we let it through, an
//     admin could lock themselves and everyone else out by
//     accident.
//   - Self-promotion is also blocked because the caller is
//     already an admin (requireAdminJson passed) — the operation
//     is a no-op and a confusing audit signal.
// ─────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_ROLES = ["user", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id }   = await context.params;

  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  // Block self-modification — see header comment.
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = (body as { role?: unknown })?.role;
  if (typeof role !== "string" || !ALLOWED_ROLES.includes(role as AllowedRole)) {
    return NextResponse.json(
      { error: `role must be one of ${ALLOWED_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Deliberately use the session-bound client for the write so
  // profiles RLS remains the data-layer guard. The route-level
  // admin check is still useful for clearer API behaviour, but
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

  return NextResponse.json({ data });
}
