"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutDashboard, BookOpen, Users, BarChart3, LogOut, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",               icon: LayoutDashboard, label: "Overview",     exact: true },
  { href: "/admin/scholarships",  icon: BookOpen,        label: "Scholarships" },
  { href: "/admin/users",         icon: Users,           label: "Users" },
  { href: "/admin/analytics",     icon: BarChart3,       label: "Analytics" },
];

interface Props {
  profile: { full_name: string | null; email: string; role: string } | null;
}

export default function AdminSidebar({ profile }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-900 flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base text-white">
            Scholar<span className="text-blue-400">Match</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        {profile && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {(profile.full_name || profile.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{profile.full_name || "Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
