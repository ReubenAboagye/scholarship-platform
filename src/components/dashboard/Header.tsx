"use client";

import { usePathname } from "next/navigation";
import { Search, ChevronRight, Compass } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { cn } from "@/lib/utils";

interface Props {
  profile: {
    full_name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null;
}

export default function DashboardHeader({ profile }: Props) {
  const pathname = usePathname();

  const segments = pathname?.split("/").filter(Boolean) || [];
  const currentPage = segments[segments.length - 1] || "dashboard";

  const formatTitle = (str: string) => {
    if (str === "dashboard") return "Overview";
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-100 glass-effect flex items-center justify-between px-5 lg:px-10">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <Compass className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-500">Dashboard</span>
          {segments.length > 1 && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-900 font-semibold">{formatTitle(currentPage)}</span>
            </>
          )}
        </div>
        <h2 className="sm:hidden text-sm font-bold text-slate-900 truncate">
          {formatTitle(currentPage)}
        </h2>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-lg mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            placeholder="Search scholarships, matches…"
            className="w-full h-9 bg-slate-50/80 border border-slate-200/60 rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
        <NotificationCenter />

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User context */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-slate-900 leading-none">
              {profile?.full_name || "User"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
              {profile?.role === "admin" ? "Administrator" : "Scholar"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-[13px] font-black text-white shadow-sm ring-2 ring-white">
            {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
