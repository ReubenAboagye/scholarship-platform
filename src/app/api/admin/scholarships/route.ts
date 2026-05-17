import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminJson } from "@/lib/auth/admin";
import { rateLimitByIp } from "@/lib/rate-limit/server";
import { getClientIp } from "@/lib/auth/ip";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/scholarships
//
// Admin-only paginated scholarship directory.
// Query params:
//   q          – free-text search on name, provider, country
//   country    – comma-separated list
//   funding    – comma-separated list
//   status     – active | inactive
//   deadline   – open | closing30 | closed
//   page       – 1-based page number
//   pageSize   – max 100, default 20
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const adminCheck = await requireAdminJson(supabase);
  if (!adminCheck.ok) return adminCheck.response;

  const ip = await getClientIp();
  const { allowed, reset } = await rateLimitByIp(ip, "admin_scholarships_api", 100, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": reset.toString() } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().replace(/,/g, ' ').toLowerCase();
  const countryList = searchParams.get("country");
  const fundingList = searchParams.get("funding");
  const status = searchParams.get("status");
  const deadline = searchParams.get("deadline");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );

  let dbQuery = supabase
    .from("scholarships")
    .select("id, name, provider, country, funding_type, application_deadline, application_url, is_active, created_at, deleted_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    dbQuery = dbQuery.or(`name.ilike.%${q}%,provider.ilike.%${q}%,country.ilike.%${q}%`);
  }

  if (countryList) {
    const countries = countryList.split(",").map((c) => c.trim()).filter(Boolean);
    if (countries.length > 0) {
      dbQuery = dbQuery.in("country", countries);
    }
  }

  if (fundingList) {
    const fundings = fundingList.split(",").map((c) => c.trim()).filter(Boolean);
    if (fundings.length > 0) {
      dbQuery = dbQuery.in("funding_type", fundings);
    }
  }

  if (status === "active") {
    dbQuery = dbQuery.eq("is_active", true);
  } else if (status === "inactive") {
    dbQuery = dbQuery.eq("is_active", false);
  }

  if (deadline && deadline !== "all") {
    const now = new Date().toISOString().split("T")[0];
    const in30Days = new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0];

    if (deadline === "open") {
      dbQuery = dbQuery.or(`application_deadline.gte.${now},application_deadline.is.null`);
    } else if (deadline === "closed") {
      dbQuery = dbQuery.lt("application_deadline", now);
    } else if (deadline === "closing30") {
      dbQuery = dbQuery.gte("application_deadline", now).lte("application_deadline", in30Days);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("GET /api/admin/scholarships error:", error);
    return NextResponse.json({ error: "Failed to load scholarships" }, { status: 500 });
  }

  return NextResponse.json({
    scholarships: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
