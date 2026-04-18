// Deadline reminder email template

export interface ReminderEmailProps {
  firstName: string;
  appUrl: string;
  scholarshipName: string;
  scholarshipSlug: string;
  scholarshipCountry: string;
  fundingAmount: string;
  applicationDeadline: string;
  daysLeft: number;
  trackerStatus: string;
}

export function buildReminderEmail({
  firstName, appUrl, scholarshipName, scholarshipSlug,
  scholarshipCountry, fundingAmount, applicationDeadline,
  daysLeft, trackerStatus,
}: ReminderEmailProps): { subject: string; html: string } {
  const urgency = daysLeft <= 3 ? "urgent" : daysLeft <= 7 ? "soon" : "upcoming";
  const subjectMap = {
    urgent:   `⚠️ ${daysLeft} day${daysLeft === 1 ? "" : "s"} left — ${scholarshipName}`,
    soon:     `📅 1 week left — ${scholarshipName}`,
    upcoming: `🔔 Deadline in ${daysLeft} days — ${scholarshipName}`,
  };
  const subject = subjectMap[urgency];

  const bannerColor = urgency === "urgent" ? "#fef2f2" : urgency === "soon" ? "#fffbeb" : "#eff6ff";
  const bannerBorder = urgency === "urgent" ? "#fca5a5" : urgency === "soon" ? "#fde68a" : "#bfdbfe";
  const bannerText = urgency === "urgent" ? "#dc2626" : urgency === "soon" ? "#d97706" : "#2563eb";

  const deadlineFormatted = new Date(applicationDeadline).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const ctaLabel = trackerStatus === "In Progress" ? "Continue application" : "Start application";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appUrl}" style="text-decoration:none;">
        <span style="font-size:20px;font-weight:900;color:#0f172a;">Scholar</span><span style="font-size:20px;font-weight:900;color:#2563eb;">Match</span>
      </a>
    </div>

    <!-- Urgency banner -->
    <div style="background:${bannerColor};border:1px solid ${bannerBorder};border-radius:12px;padding:14px 18px;margin-bottom:20px;text-align:center;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${bannerText};">
        ${urgency === "urgent" ? "⚠️" : urgency === "soon" ? "⏰" : "📅"} Deadline in <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong>
      </p>
    </div>

    <!-- Main card -->
    <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 6px;font-size:15px;color:#64748b;">Hey ${firstName},</p>
      <h1 style="margin:0 0 20px;font-size:19px;font-weight:800;color:#0f172a;line-height:1.3;">${scholarshipName}</h1>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8;width:40%;">Country</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b;">${scholarshipCountry}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8;">Funding</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b;">${fundingAmount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#94a3b8;">Deadline</td>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:${bannerText};">${deadlineFormatted}</td>
        </tr>
      </table>

      <div style="display:flex;gap:12px;flex-direction:column;">
        <a href="${appUrl}/scholarships/${scholarshipSlug}" style="background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:block;text-align:center;">${ctaLabel} →</a>
        <a href="${appUrl}/dashboard/tracker" style="color:#64748b;font-size:12px;text-decoration:none;text-align:center;">View in tracker</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;line-height:1.7;">
      <p style="margin:0;">You saved this scholarship on ScholarMatch.</p>
      <p style="margin:4px 0 0;"><a href="${appUrl}/dashboard/profile" style="color:#94a3b8;">Manage notifications</a></p>
    </div>

  </div>
</body>
</html>`;

  return { subject, html };
}
