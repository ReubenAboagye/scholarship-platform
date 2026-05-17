"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, BarChart3, LogOut, ChevronLeft, ShieldCheck, History, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

interface Props {
  profile: { full_name: string | null; email: string; role: string } | null;
}

export default function AdminSidebar({ profile }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isSuperAdmin = profile?.role === "super_admin";

  const navItems = [
    { href: "/admin",               icon: LayoutDashboard, label: "Overview",     exact: true },
    { href: "/admin/scholarships",  icon: BookOpen,        label: "Scholarships", exact: false },
    { href: "/admin/users",         icon: Users,           label: "Users",        exact: false },
    { href: "/admin/analytics",     icon: BarChart3,       label: "Analytics",    exact: false },
    { href: "/admin/security/mfa",   icon: ShieldCheck,     label: "MFA Security", exact: false },
    ...(isSuperAdmin ? [{ href: "/admin/audit", icon: History, label: "Audit Log", exact: false }] : []),
    { href: "/admin/settings",      icon: Settings,        label: "Settings",     exact: false },
  ];

  const mobileNavItems = [
    { href: "/admin",               icon: LayoutDashboard, label: "Home" },
    { href: "/admin/scholarships",  icon: BookOpen,        label: "Scholarships" },
    { href: "/admin/users",         icon: Users,           label: "Users" },
    { href: "/admin/analytics",     icon: BarChart3,       label: "Analytics" },
    { href: "/admin/security/mfa",   icon: ShieldCheck,     label: "MFA" },
    ...(isSuperAdmin ? [{ href: "/admin/audit", icon: History, label: "Audit" }] : []),
    { href: "/admin/settings",      icon: Settings,        label: "Settings" },
  ];

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === href
      : pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = profile
    ? (profile.full_name || profile.email)[0].toUpperCase()
    : "?";

  const sidebarContent = (
    <>
      <div
        className={cn(
          "flex items-center border-b border-zinc-100 h-14 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <a href="/admin" className="flex items-baseline">
            <span className="text-xl tracking-tight text-zinc-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
              Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
            </span>
          </a>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 pt-4 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <p className="px-3 text-[10px] font-medium text-zinc-400 uppercase tracking-[0.15em] mb-3 opacity-70">
            Governance
          </p>
        )}
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all rounded-md relative",
                active
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
                collapsed && "justify-center"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -tranzinc-y-1/2 w-[3px] h-4 bg-brand-500 rounded-r-full" />
              )}
              <item.icon className={cn("flex-shrink-0", collapsed ? "size-5" : "size-4")} />
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 shrink-0">
        {profile ? (
          <button
            onClick={handleSignOut}
            title="Sign out"
            className={cn(
              "w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left",
              collapsed && "justify-center px-2"
            )}
          >
            <div className="size-8 rounded bg-zinc-900 text-white flex items-center justify-center text-[10px] font-medium shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {profile.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                </div>
                <LogOut className="size-4 text-zinc-400 shrink-0" />
              </>
            )}
          </button>
        ) : (
          <div className="p-4 text-center">
            <button
              onClick={handleSignOut}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="size-4 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-zinc-200 transition-all duration-200 flex-shrink-0 sticky top-0 h-screen",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-100 flex items-stretch h-16 safe-bottom">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all active:scale-95 relative",
                active ? "text-brand-600" : "text-zinc-400"
              )}
            >
              <item.icon className={cn("size-5", active && "scale-110")} />
              <span>{item.label}</span>
              {active && (
                <div className="absolute -top-[1px] left-1/2 -tranzinc-x-1/2 w-8 h-[2px] bg-brand-600 rounded-b-full" />
              )}
            </a>
          );
        })}
      </nav>
    </>
  );
}
