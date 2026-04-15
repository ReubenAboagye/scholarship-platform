"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Search, Bookmark, ListChecks, User, LogOut, ChevronLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/match",   icon: Sparkles,        label: "AI Match"  },
  { href: "/scholarships",      icon: Search,          label: "Browse"    },
  { href: "/dashboard/saved",   icon: Bookmark,        label: "Saved"     },
  { href: "/dashboard/tracker", icon: ListChecks,      label: "Tracker"   },
  { href: "/dashboard/profile", icon: User,            label: "Profile"   },
];

interface Props {
  profile: { full_name: string | null; email: string; role: string; avatar_url: string | null } | null;
}

export default function DashboardSidebar({ profile }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [pathname, setPathname]   = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = profile
    ? (profile.full_name || profile.email)[0].toUpperCase()
    : "?";

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0",
      collapsed ? "w-[60px]" : "w-[220px]"
    )}>
      <div className={cn("flex items-center border-b border-slate-100 h-14 px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-black text-[15px] text-slate-900">Scholar</span>
            <span className="font-black text-[15px] text-brand-600">Match</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 pt-3">
        {navItems.map((item) => {
          const active = pathname === item.href
            || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isAI = item.href === "/dashboard/match";
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : isAI
                    ? "text-brand-600 hover:bg-brand-50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                collapsed && "justify-center"
              )}>
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-2">
        {!collapsed && profile && (
          <div className="flex items-center gap-2.5 px-2 py-2.5 mb-1">
            <div className="w-7 h-7 bg-slate-900 flex items-center justify-center flex-shrink-0 text-xs font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{profile.full_name || "User"}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2 w-full px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors",
            collapsed && "justify-center"
          )}>
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
