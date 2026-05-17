import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Admin role lookup failed", { userId, error });
  } else if (!profile) {
    console.warn("Admin role lookup found no profile", { userId });
  }

  return !error && (profile?.role === "admin" || profile?.role === "super_admin");
}

export async function isSuperAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Super admin role lookup failed", { userId, error });
  } else if (!profile) {
    console.warn("Super admin role lookup found no profile", { userId });
  }

  return !error && profile?.role === "super_admin";
}

export async function requireAdminJson(supabase: SupabaseClient) {
  const user = await getAuthenticatedUser(supabase);
  if (!user || !user.email_confirmed_at) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdmin = await isAdminUser(supabase, user.id);
  if (!isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

export async function requireSuperAdminJson(supabase: SupabaseClient) {
  const user = await getAuthenticatedUser(supabase);
  if (!user || !user.email_confirmed_at) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isSuper = await isSuperAdminUser(supabase, user.id);
  if (!isSuper) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

/**
 * Check whether the authenticated session has MFA assurance level AAL2.
 * Supabase Auth MFA must also be configured operationally in the
 * Supabase dashboard (Enforce MFA = ON for admin roles) for this to
 * provide real protection.
 */
export async function hasAal2(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // The user object may carry an `aal` claim when MFA is enabled.
    const aal = (user as unknown as Record<string, unknown> | null)?.aal;
    if (typeof aal === "string" && aal === "aal2") {
      return true;
    }

    // Fallback to the MFA helper if available.
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return aalData?.currentLevel === "aal2";
  } catch {
    return false;
  }
}

export async function requireAdminPageAccess(): Promise<User> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");
  if (!user.email_confirmed_at) redirect("/dashboard?error=unverified");

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return user;
}

export async function requireSuperAdminPageAccess(): Promise<User> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");
  if (!user.email_confirmed_at) redirect("/dashboard?error=unverified");

  const isSuper = await isSuperAdminUser(supabase, user.id);
  if (!isSuper) redirect("/admin");

  return user;
}
