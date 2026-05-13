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

  return !error && profile?.role === "admin";
}

export async function requireAdminJson(supabase: SupabaseClient) {
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
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

export async function requireAdminPageAccess(): Promise<User> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return user;
}
