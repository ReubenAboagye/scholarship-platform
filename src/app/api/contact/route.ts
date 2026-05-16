import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { buildContactEmail } from "@/emails/contact";
import { getClientIp } from "@/lib/auth/ip";
import { rateLimitByIp, rateLimitByKey } from "@/lib/rate-limit/server";
import { readJsonBody } from "@/lib/server/body-size";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridgeai.netlify.app";
const FROM = "ScholarMatch <onboarding@resend.dev>";
const TO = process.env.CONTACT_EMAIL ?? "reubenaboagye23@gmail.com";

// Zod schema for form validation
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject must be at least 2 characters").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
  website: z.string().max(200).optional().default(""),
});

function tooManyRequests(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many messages. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

const MAX_BODY_BYTES = 16_384; // 16 KB — generous for a contact form

export async function POST(req: NextRequest) {
  try {
    const bodyResult = await readJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    // Validate form data
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, email, subject, message } = validationResult.data;
    if (validationResult.data.website) {
      return NextResponse.json({ success: true, message: "Message sent successfully" });
    }

    const ip = await getClientIp();
    const [ipLimit, emailLimit] = await Promise.all([
      rateLimitByIp(ip, "contact_ip", 3, 60 * 60),
      rateLimitByKey(email.toLowerCase(), "contact_email", 2, 60 * 60),
    ]);

    if (!ipLimit.allowed) return tooManyRequests(ipLimit.reset);
    if (!emailLimit.allowed) return tooManyRequests(emailLimit.reset);

    // Build and send email
    const { subject: emailSubject, html } = buildContactEmail({ name, email, subject, message });

    const emailResult = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: emailSubject,
      html,
      replyTo: email,
    });

    if (emailResult.error) {
      console.error("Resend API error:", emailResult.error);
      return NextResponse.json({ error: "Failed to send email. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
  }
}
