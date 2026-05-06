"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimitByIp } from "@/lib/rate-limit/server";
import { getClientIp } from "@/lib/auth/ip";
import { validatePassword } from "@/lib/auth/password";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/auth/site-url";

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function checkHoneypot(formData: FormData): boolean {
  return Boolean(formData.get("website"));
}

async function enforceRateLimit(ip: string, namespace: string) {
  const { allowed, reset } = await rateLimitByIp(ip, namespace, 5, 900);
  if (!allowed) {
    const minutes = Math.ceil((reset - Date.now()) / 60000);
    return `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
// Sign In
/* ------------------------------------------------------------------ */

export async function signInAction(formData: FormData) {
  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit(ip, "login");
  if (rateLimitError) return { error: rateLimitError };

  if (checkHoneypot(formData)) {
    return { error: "Unable to sign in. Please try again later." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeRedirectPath(String(formData.get("redirectTo") ?? "/dashboard"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Supabase server client has already set session cookies
  return { success: true, redirectTo };
}

/* ------------------------------------------------------------------ */
// Sign Up
/* ------------------------------------------------------------------ */

export async function signUpAction(formData: FormData) {
  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit(ip, "signup");
  if (rateLimitError) return { error: rateLimitError };

  if (checkHoneypot(formData)) {
    return { error: "Unable to create account. Please try again later." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (fullName.length > 100) return { error: "Full name is too long." };
  if (email.length > 254) return { error: "Email is too long." };
  if (password.length > 128) return { error: "Password is too long." };
  const redirectTo = sanitizeRedirectPath(String(formData.get("redirectTo") ?? "/dashboard"));

  if (!fullName || !email || !password) {
    return { error: "All fields are required." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const origin = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
      return { error: "If this email is not registered, a confirmation link has been sent." };
    }
    return { error: "Unable to create account. Please try again." };
  }

  return { success: true };
}

/* ------------------------------------------------------------------ */
// Google OAuth — rate-limited + returns the consent URL
/* ------------------------------------------------------------------ */

export async function signInWithGoogleAction(formData: FormData) {
  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit(ip, "login");
  if (rateLimitError) return { error: rateLimitError };

  const redirectTo = sanitizeRedirectPath(String(formData.get("redirectTo") ?? "/dashboard"));
  const origin = await getSiteUrl();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error || !data?.url) {
    return { error: error?.message ?? "Unable to start Google sign-in." };
  }

  return { url: data.url };
}

/* ------------------------------------------------------------------ */
// Reset Password
/* ------------------------------------------------------------------ */

export async function resetPasswordAction(formData: FormData) {
  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit(ip, "reset");
  if (rateLimitError) return { error: rateLimitError };

  if (checkHoneypot(formData)) {
    return { error: "Unable to send reset link. Please try again later." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Email is required." };
  }

  const origin = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
