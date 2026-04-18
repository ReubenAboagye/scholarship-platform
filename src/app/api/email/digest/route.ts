import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { buildDigestEmail } from "@/emails/digest";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridge-ai.netlify.app";
const FROM    = "ScholarMatch <digest@scholarbridge-ai.netlify.app>";

// Called by Supabase cron or manually — protected by CRON_SECRET header
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all users with email and recent match history
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, field_of_study, degree_level, citizenship, gpa, bio, career_goals")
    .not("email", "is", null);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      // Skip if digest already sent today
      const today = new Date().toISOString().split("T")[0];
      const { data: alreadySent } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "weekly_digest")
        .gte("sent_at", today)
        .limit(1)
        .maybeSingle();

      if (alreadySent) continue;

      // Get latest match session top 3
      const { data: session } = await supabase
        .from("match_history")
        .select("results")
        .eq("user_id", user.id)
        .order("run_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const topMatches = ((session?.results ?? []) as any[])
        .slice(0, 3)
        .map((r: any) => ({
          name:                 r.scholarship.name,
          country:              r.scholarship.country,
          funding_type:         r.scholarship.funding_type,
          funding_amount:       r.scholarship.funding_amount,
          application_deadline: r.scholarship.application_deadline,
          slug:                 r.scholarship.slug ?? r.scholarship.id,
          match_score:          r.match_score,
        }));

      // Get upcoming deadlines from tracker (next 14 days)
      const in14 = new Date(Date.now() + 14 * 86_400_000).toISOString().split("T")[0];
      const { data: tracked } = await supabase
        .from("application_tracker")
        .select("status, scholarship:scholarships(name, slug, application_deadline)")
        .eq("user_id", user.id)
        .in("status", ["Interested", "In Progress"])
        .not("scholarships.application_deadline", "is", null)
        .lte("scholarships.application_deadline", in14)
        .gte("scholarships.application_deadline", new Date().toISOString().split("T")[0]);

      const deadlines = (tracked ?? [])
        .filter((t: any) => t.scholarship?.application_deadline)
        .map((t: any) => ({
          scholarship_name:     t.scholarship.name,
          application_deadline: t.scholarship.application_deadline,
          status:               t.status,
          slug:                 t.scholarship.slug ?? "",
        }));

      // Skip if nothing useful to send
      if (topMatches.length === 0 && deadlines.length === 0) continue;

      // Profile completeness nudge
      const fields = [user.field_of_study, user.degree_level, user.citizenship, user.gpa, user.bio, user.career_goals];
      const completionPct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
      const missingField = !user.citizenship ? "citizenship" : !user.career_goals ? "career goals" : undefined;
      const missingFieldGain = missingField ? 5 : undefined;

      const { subject, html } = buildDigestEmail({
        firstName:       user.full_name?.split(" ")[0] ?? "there",
        appUrl:          APP_URL,
        topMatches,
        deadlines,
        completionPct,
        missingField,
        missingFieldGain,
      });

      await resend.emails.send({ from: FROM, to: user.email, subject, html });

      // Log it
      await supabase.from("notification_log").insert({
        user_id: user.id,
        type:    "weekly_digest",
        channel: "email",
      });

      // Also create in-app notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type:    "digest",
        title:   "Your weekly digest is ready",
        body:    topMatches.length > 0 ? `${topMatches[0].name} is your top match this week.` : "Check your upcoming deadlines.",
        href:    "/dashboard/matches",
      });

      sent++;
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`);
    }
  }

  return NextResponse.json({ sent, errors });
}
