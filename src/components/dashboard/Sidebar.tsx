"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Search, Bookmark, ListChecks,
  User, LogOut, ChevronLeft, Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

const navItems = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/match",   icon: Sparkles,        label: "AI Match"  },
  { href: "/dashboard/scholarships", icon: Search,     label: "Browse"    },
  { href: "/dashboard/saved",   icon: Bookmark,        label: "Saved"     },
  { href: "/dashboard/tracker", icon: ListChecks,      label: "Tracker"   },
  { href: "/dashboard/profile", icon: User,            label: "Profile"   },
];

const mobileNavItems = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Home"    },
  { href: "/dashboard/match",   icon: Sparkles,        label: "Match"   },
  { href: "/dashboard/scholarships", icon: Search,      label: "Browse"  },
  { href: "/dashboard/tracker", icon: ListChecks,      label: "Tracker" },
  { href: "/dashboard/profile", icon: User,            label: "Profile" },
];

interface Props {
  profile: {
    full_name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null;
}

export default function DashboardSidebar({ profile }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => { setPathname(window.location.pathname); }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = profile
    ? (profile.full_name || profile.email)[0].toUpperCase()
    : "?";

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0 sticky top-0 h-screen",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-slate-100 h-16 px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <a href="/" className="flex items-center gap-1.5 h-10">
              <span className="font-black text-[16px] text-slate-900 tracking-tight">Scholar</span>
              <span className="font-black text-[16px] text-brand-600 tracking-tight">Match</span>
            </a>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 pt-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isAI   = item.href === "/dashboard/match";
            return (
              <a
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : isAI
                      ? "text-brand-600 hover:bg-brand-50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                {!collapsed && <span>{item.label}</span>}
              </a>
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
                <p className="text-xs font-bold text-slate-800 truncate">
                  {profile.full_name || "User"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-2 w-full px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>



      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-stretch h-16 safe-bottom">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          const isAI   = item.href === "/dashboard/match";
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all active:scale-90",
                active
                  ? "text-brand-600"
                  : isAI
                    ? "text-brand-400"
                    : "text-slate-400"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "scale-110")} />
              <span>{item.label}</span>
              {active && <div className="absolute bottom-0 w-6 h-0.5 bg-brand-600 rounded-full" />}
            </a>
          );
        })}
      </nav>
    </>
  );
}
