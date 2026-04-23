"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Search, Bookmark, ListChecks,
  User, LogOut, ChevronLeft, Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

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
            <a href="/" className="flex items-baseline">
              <span className="text-xl tracking-tight text-slate-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
                Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
              </span>
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

        <div className="border-t border-slate-100 shrink-0">
          {profile ? (
            <button
              onClick={handleSignOut}
              title="Sign out"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left",
                collapsed && "justify-center px-2"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {profile.full_name || "Account"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  </div>
                  <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
                </>
              )}
            </button>
          ) : (
            <div className="p-4 text-center">
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
              >
                <LogOut className="w-4 h-4 mx-auto" />
              </button>
            </div>
          )}
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
