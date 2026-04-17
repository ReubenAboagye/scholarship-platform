import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/admin";
import { ExternalLink, Search, Bell } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <AdminSidebar profile={profile} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Professional Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[100px]" />
        </div>

        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger (Visual Only for now as mobile sidebar isn't implemented) */}
            <div className="md:hidden w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-slate-600 rounded-full" />
                <div className="w-3 h-0.5 bg-slate-600 rounded-full" />
                <div className="w-5 h-0.5 bg-slate-600 rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Functional-looking Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-slate-900 w-32 lg:w-48 placeholder:text-slate-400" />
            </div>

            <div className="flex items-center gap-2">
              <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              
              <Link 
                href="/" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-50 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative z-10 p-6 lg:p-8 scroll-smooth">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
