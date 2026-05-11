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
    <div className="h-[100dvh] bg-paper flex overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <DashboardHeader profile={profile} />
        <div className="flex-1 p-5 lg:p-10 pb-28 md:pb-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
