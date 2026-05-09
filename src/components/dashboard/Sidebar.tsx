"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, Bookmark, ListChecks,
  User, ChevronLeft, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
          "hidden md:flex flex-col bg-paper border-r border-zinc-200/80 transition-all duration-300 ease-out flex-shrink-0 sticky top-0 h-full",
          collapsed ? "w-[68px]" : "w-[232px]"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-zinc-100/80 h-16 px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <a href="/" className="flex items-baseline">
              <span className="text-lg tracking-tight text-zinc-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
                Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
              </span>
            </a>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/80 rounded-lg transition-colors"
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 pt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isAI   = item.href === "/dashboard/match";
            return (
              <a
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all",
                  active
                    ? "bg-white text-brand-700 font-semibold shadow-sm border border-zinc-100"
                    : isAI
                      ? "text-brand-600 hover:bg-white/60 hover:shadow-sm"
                      : "text-zinc-500 hover:bg-white/60 hover:text-zinc-800",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("flex-shrink-0", collapsed ? "size-5" : "size-4")} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && isAI && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </aside>



      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-100 flex items-stretch min-h-[64px] safe-bottom shadow-[0_-6px_16px_rgba(2,6,23,0.04)] rounded-t-2xl">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          const isAI   = item.href === "/dashboard/match";
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all active:scale-95 relative pt-1",
                active
                  ? "text-brand-600"
                  : isAI
                    ? "text-brand-500"
                    : "text-zinc-400"
              )}
            >
              <item.icon className={cn("size-[22px]", active && "scale-110")} />
              <span>{item.label}</span>
              {active && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-600 rounded-b-full" />
              )}
            </a>
          );
        })}
      </nav>
    </>
  );
}
