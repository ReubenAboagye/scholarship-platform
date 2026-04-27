import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// GET /go/[id]
//
// Gated outbound redirect to a scholarship's external application
// URL. Soft-wall pattern: the public detail page stays indexable,
// but the actual click-through to apply requires an authenticated
// session.
//
// Flow:
//   - Logged out → 302 to /auth/login?redirectTo=/go/[id].
//                  After auth, the callback route honours the
//                  redirectTo and the user lands back here, this
//                  time logged in.
//   - Logged in → log an `apply_start` match event (best-effort,
//                 fire-and-forget), then 302 to the external URL.
//
// We also support id-as-slug, mirroring the public detail page.
//
// Defensive choices:
//   - Inactive or missing scholarship → 404 page, not a redirect
//     to nowhere.
//   - Missing application_url → 404 with a clearer message.
//   - The external URL is *not* validated beyond "is it a string".
//     We trust admins. If we ever accept user-submitted listings
//     this needs an allow-list / scheme check (https only).
// ─────────────────────────────────────────────────────────────

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // Look up by UUID or slug.
  const isUuid = UUID_RE.test(id);
  const { data: scholarship } = isUuid
    ? await supabase
        .from("scholarships")
        .select("id, application_url, is_active")
        .eq("id", id)
        .single()
    : await supabase
        .from("scholarships")
        .select("id, application_url, is_active")
        .eq("slug", id)
        .single();

  if (!scholarship || !scholarship.is_active) {
    return NextResponse.redirect(new URL("/scholarships?missing=1", req.url));
  }

  if (!scholarship.application_url) {
    // Should not happen for a published scholarship, but degrade
    // gracefully by sending the user back to the detail page.
    return NextResponse.redirect(new URL(`/scholarships/${id}`, req.url));
  }

  // Auth check happens *after* lookup so that an invalid id never
  // sends an anonymous user through a fruitless login round-trip.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const next = `/go/${id}`;
    const loginUrl = new URL(
      `/auth/login?redirectTo=${encodeURIComponent(next)}`,
      req.url,
    );
    return NextResponse.redirect(loginUrl);
  }

  // Best-effort funnel logging. Failures are swallowed so a logging
  // hiccup never blocks the actual apply click — the external
  // redirect is the user's primary intent, the event is bonus.
  try {
    await supabase.rpc("log_match_event", {
      p_scholarship_id: scholarship.id,
      p_event_type:     "apply_start",
      p_rank_position:  null,
      p_match_score:    null,
      p_reason_code:    null,
      p_session_id:     null,
    });
  } catch (err) {
    console.warn("apply_start log failed:", err);
  }

  return NextResponse.redirect(scholarship.application_url, { status: 302 });
}
