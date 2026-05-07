import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return <AdminLayoutClient profile={profile}>{children}</AdminLayoutClient>;
}
