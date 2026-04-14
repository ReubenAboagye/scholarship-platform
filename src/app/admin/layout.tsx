import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar profile={profile} />
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
