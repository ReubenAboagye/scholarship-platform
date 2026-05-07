import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).maybeSingle();

  if (profileError) {
    console.warn("Admin layout profile lookup failed", { userId: user.id, error: profileError });
  } else if (!profile) {
    console.warn("Admin layout profile lookup found no profile", { userId: user.id });
  }

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return <AdminLayoutClient profile={profile}>{children}</AdminLayoutClient>;
}
