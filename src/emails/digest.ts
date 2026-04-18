// Weekly digest email template
// Plain HTML — no React Email dependency needed, works with Resend directly

export interface DigestMatch {
  name: string;
  country: string;
  funding_type: string;
  funding_amount: string;
  application_deadline: string | null;
  slug: string;
  match_score: number;
}

export interface DigestDeadline {
  scholarship_name: string;
  application_deadline: string;
  status: string;
  slug: string;
}

interface DigestEmailProps {
  firstName: string;
  appUrl: string;
  topMatches: DigestMatch[];
  deadlines: DigestDeadline[];
  completionPct: number;
  missingField?: string;
  missingFieldGain?: number;
}

function deadlinePill(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (days <= 3)  return `<span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">${days}d left</span>`;
  if (days <= 14) return `<span style="background:#fffbeb;color:#d97706;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">${days}d left</span>`;
  return `<span style="background:#f8fafc;color:#64748b;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">${days}d left</span>`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function buildDigestEmail({ firstName, appUrl, topMatches, deadlines, completionPct, missingField, missingFieldGain }: DigestEmailProps): { subject: string; html: string } {
  const subject = `Your weekly scholarship digest — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;

  const matchRows = topMatches.map(m => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <a href="${appUrl}/scholarships/${m.slug}" style="font-weight:600;color:#1e293b;text-decoration:none;font-size:14px;">${m.name}</a>
        <div style="margin-top:4px;font-size:12px;color:#94a3b8;">${m.country} · ${m.funding_type} · ${m.funding_amount}</div>
        ${m.application_deadline ? `<div style="margin-top:4px;">${deadlinePill(m.application_deadline)}</div>` : ""}
      </td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;">
        <span style="background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;white-space:nowrap;">${m.match_score}% match</span>
      </td>
    </tr>
  `).join("");

  const deadlineRows = deadlines.map(d => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <a href="${appUrl}/scholarships/${d.slug}" style="font-weight:600;color:#1e293b;text-decoration:none;font-size:13px;">${d.scholarship_name}</a>
        <div style="margin-top:3px;font-size:11px;color:#94a3b8;">${d.status}</div>
      </td>
      <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:middle;">
        ${deadlinePill(d.application_deadline)}
      </td>
    </tr>
  `).join("");

  const nudge = completionPct < 80 && missingField ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-top:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        💡 Adding your <strong>${missingField}</strong> could unlock up to <strong>${missingFieldGain} more</strong> scholarship matches.
        <a href="${appUrl}/dashboard/profile" style="color:#d97706;font-weight:600;margin-left:4px;">Complete profile →</a>
      </p>
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${appUrl}" style="text-decoration:none;">
        <span style="font-size:22px;font-weight:900;color:#0f172a;">Scholar</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Match</span>
      </a>
      <p style="color:#94a3b8;font-size:12px;margin-top:6px;">Your weekly scholarship digest</p>
    </div>

    <!-- Greeting -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Hey ${firstName} 👋</h1>
      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Here&apos;s your weekly round-up of top scholarship matches and upcoming deadlines.</p>
    </div>

    ${topMatches.length > 0 ? `
    <!-- Top matches -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">🎯 Top Matches This Week</h2>
      <table style="width:100%;border-collapse:collapse;">${matchRows}</table>
      <div style="margin-top:16px;text-align:center;">
        <a href="${appUrl}/dashboard/matches" style="background:#2563eb;color:#fff;padding:10px 24px;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;display:inline-block;">View all matches</a>
      </div>
    </div>` : ""}

    ${deadlines.length > 0 ? `
    <!-- Deadlines -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">⏰ Upcoming Deadlines</h2>
      <table style="width:100%;border-collapse:collapse;">${deadlineRows}</table>
      <div style="margin-top:16px;text-align:center;">
        <a href="${appUrl}/dashboard/tracker" style="color:#2563eb;font-weight:600;font-size:13px;text-decoration:none;">Open tracker →</a>
      </div>
    </div>` : ""}

    ${nudge}

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;color:#94a3b8;font-size:11px;line-height:1.7;">
      <p style="margin:0;">You&apos;re receiving this because you have an account on ScholarMatch.</p>
      <p style="margin:4px 0 0;"><a href="${appUrl}/dashboard/profile" style="color:#94a3b8;">Manage notifications</a> · <a href="${appUrl}" style="color:#94a3b8;">Visit dashboard</a></p>
    </div>

  </div>
</body>
</html>`;

  return { subject, html };
}
