import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <DashboardSidebar profile={profile} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <DashboardHeader profile={profile} />
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 md:pb-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
