// Contact form email template
// Plain HTML — works with Resend directly

export interface ContactEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function buildContactEmail({ name, email, subject, message }: ContactEmailProps): { subject: string; html: string } {
  const emailSubject = `[${subject}] Contact Form: ${name}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:900;color:#0f172a;">Scholar</span><span style="font-size:24px;font-weight:900;color:#2563eb;">Match</span>
      <p style="color:#94a3b8;font-size:12px;margin-top:6px;">New contact form submission</p>
    </div>

    <!-- Content Card -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">From</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${name}</p>
        <a href="mailto:${email}" style="color:#2563eb;font-size:14px;text-decoration:none;">${email}</a>
      </div>

      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Subject</p>
        <p style="margin:0;font-size:14px;color:#1e293b;">${subject}</p>
      </div>

      <div>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Message</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;">${message}</p>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;">
      <p style="margin:0;">Sent via ScholarMatch contact form</p>
      <p style="margin:4px 0 0;">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
    </div>

  </div>
</body>
</html>`;

  return { subject: emailSubject, html };
}
