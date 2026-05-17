import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdminJson } from "@/lib/auth/admin";
import { rateLimitByIp } from "@/lib/rate-limit/server";
import { getClientIp } from "@/lib/auth/ip";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/audit/scholarships
//
// SuperAdmin-only paginated audit log for scholarships.
// Query params:
//   action     – filter by action type (create | update | soft_delete | etc)
//   page       – 1-based page number
//   pageSize   – max 100, default 20
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const superAdminCheck = await requireSuperAdminJson(supabase);
  if (!superAdminCheck.ok) return superAdminCheck.response;

  const ip = await getClientIp();
  const { allowed, reset } = await rateLimitByIp(ip, "admin_audit_api", 50, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": reset.toString() } }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );

  let dbQuery = supabase
    .from("admin_scholarship_audit_log")
    .select(`
      id,
      action,
      reason,
      ip_address,
      user_agent,
      created_at,
      old_snapshot,
      new_snapshot,
      scholarships ( id, name ),
      profiles ( id, email, full_name )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (action && action !== "all") {
    dbQuery = dbQuery.eq("action", action);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("GET /api/admin/audit/scholarships error:", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
