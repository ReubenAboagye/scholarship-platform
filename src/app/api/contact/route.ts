import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { buildContactEmail } from "@/emails/contact";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridge-ai.netlify.app";
const APP_DOMAIN = new URL(APP_URL).hostname;
const FROM = `ScholarMatch <contact@${APP_DOMAIN}>`;
const TO = process.env.CONTACT_EMAIL ?? "support@gentechmart.shop";

// Zod schema for form validation
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject must be at least 2 characters").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate form data
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, email, subject, message } = validationResult.data;

    // Build and send email
    const { subject: emailSubject, html } = buildContactEmail({ name, email, subject, message });

    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: emailSubject,
      html,
      replyTo: email,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
  }
}
