import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson } from "@/lib/auth/admin";

// ─────────────────────────────────────────────────────────────
// GET /api/users
//
// Admin-only paginated user directory.
// Query params:
//   q          – free-text search on full_name + email
//   role       – filter by role (user | admin | super_admin)
//   onboard    – complete | incomplete
//   joined     – 7d | 30d | 90d
//   country    – comma-separated list
//   page       – 1-based page number
//   pageSize   – max 100, default 25
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const role = searchParams.get("role");
  const onboard = searchParams.get("onboard");
  const joined = searchParams.get("joined");
  const countryList = searchParams.get("country");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10) || 25)
  );

  const dayMs = 86_400_000;
  const now = Date.now();
  const joinedCutoff =
    joined === "7d"  ? new Date(now - 7  * dayMs).toISOString() :
    joined === "30d" ? new Date(now - 30 * dayMs).toISOString() :
    joined === "90d" ? new Date(now - 90 * dayMs).toISOString() :
    null;

  // Build the query
  let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, email, role, country_of_origin, onboarding_complete, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // Use ilike for simple text search on both fields
    dbQuery = dbQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  if (role && role !== "all") {
    dbQuery = dbQuery.eq("role", role);
  }

  if (onboard === "complete") {
    dbQuery = dbQuery.eq("onboarding_complete", true);
  } else if (onboard === "incomplete") {
    dbQuery = dbQuery.eq("onboarding_complete", false);
  }

  if (joinedCutoff) {
    dbQuery = dbQuery.gte("created_at", joinedCutoff);
  }

  if (countryList) {
    const countries = countryList.split(",").map((c) => c.trim()).filter(Boolean);
    if (countries.length > 0) {
      // Supabase .in() works for exact matches. "Other" is handled
      // by checking for null / not-in-known-countries on the client.
      // For simplicity, we just do exact .in() here.
      dbQuery = dbQuery.in("country_of_origin", countries);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const [{ data, error, count }, { data: allProfiles, error: statsError }] = await Promise.all([
    dbQuery,
    supabase.from("profiles").select("role, created_at, onboarding_complete"),
  ]);

  if (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  const weekAgo = now - 7 * dayMs;
  const stats = {
    total: allProfiles?.length ?? 0,
    admins: allProfiles?.filter((u) => u.role === "admin" || u.role === "super_admin").length ?? 0,
    newThisWeek: allProfiles?.filter((u) => new Date(u.created_at).getTime() > weekAgo).length ?? 0,
    onboardRate: allProfiles && allProfiles.length > 0
      ? Math.round((allProfiles.filter((u) => u.onboarding_complete).length / allProfiles.length) * 100)
      : 0,
  };

  return NextResponse.json({
    users: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    stats,
  });
}
