import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { buildReminderEmail } from "@/emails/reminder";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridge-ai.netlify.app";
const APP_DOMAIN = new URL(APP_URL).hostname;
const FROM       = `ScholarMatch <reminders@${APP_DOMAIN}>`;

// POST /api/email/reminders — run daily via Supabase cron or external scheduler
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today    = new Date().toISOString().split("T")[0];

  // Find all saved/in-progress applications with deadlines in exactly 3 or 7 days
  const targets = [3, 7];
  let sent   = 0;
  const errors: string[] = [];

  for (const daysAhead of targets) {
    const targetDate = new Date(Date.now() + daysAhead * 86_400_000)
      .toISOString().split("T")[0];

    const { data: rows } = await supabase
      .from("application_tracker")
      .select(`
        id, status, user_id,
        scholarship:scholarships(id, name, slug, country, funding_amount, application_deadline)
      `)
      .in("status", ["Interested", "In Progress"])
      .eq("scholarships.application_deadline", targetDate);

    for (const row of rows ?? []) {
      const s = (row as any).scholarship;
      if (!s) continue;

      try {
        // Check dedup — already sent this reminder for this scholarship+days?
        const { data: alreadySent } = await supabase
          .from("notification_log")
          .select("id")
          .eq("user_id", row.user_id)
          .eq("type",    `deadline_${daysAhead}d`)
          .eq("ref_id",  s.id)
          .gte("sent_at", today)
          .limit(1)
          .maybeSingle();

        if (alreadySent) continue;

        // Get user email + notification preferences
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name, notification_preferences")
          .eq("id", row.user_id)
          .single();

        if (!profile?.email) continue;

        // Respect user's notification preferences
        const prefs = (profile as any).notification_preferences ?? {};
        if (prefs.deadline_reminders === false) continue;

        const { subject, html } = buildReminderEmail({
          firstName:           profile.full_name?.split(" ")[0] ?? "there",
          appUrl:              APP_URL,
          scholarshipName:     s.name,
          scholarshipSlug:     s.slug || s.id,
          scholarshipCountry:  s.country,
          fundingAmount:       s.funding_amount,
          applicationDeadline: s.application_deadline,
          daysLeft:            daysAhead,
          trackerStatus:       row.status,
        });

        await resend.emails.send({ from: FROM, to: profile.email, subject, html });

        // Log to prevent duplicate sends
        await supabase.from("notification_log").insert({
          user_id: row.user_id,
          type:    `deadline_${daysAhead}d`,
          ref_id:  s.id,
          channel: "email",
        });

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: row.user_id,
          type:    daysAhead <= 3 ? "deadline_urgent" : "deadline_soon",
          title:   `${daysAhead} day${daysAhead === 1 ? "" : "s"} left — ${s.name}`,
          body:    `Deadline: ${new Date(s.application_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          href:    `/dashboard/scholarships/${s.slug || s.id}`,
        });

        sent++;
      } catch (err: any) {
        errors.push(`${row.user_id}/${s.name}: ${err.message}`);
      }
    }
  }

  return NextResponse.json({ sent, errors });
}
