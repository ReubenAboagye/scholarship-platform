"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, ExternalLink } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/scholarships": "Scholarships",
  "/admin/scholarships/new": "New Scholarship",
  "/admin/users": "Users",
  "/admin/analytics": "Analytics",
};

function pageLabel(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  // Handle /admin/scholarships/[id]/edit
  if (/^\/admin\/scholarships\/[^/]+\/edit$/.test(path)) return "Edit Scholarship";
  if (/^\/admin\/scholarships\/[^/]+$/.test(path)) return "Scholarship Detail";
  // Fallback: use last segment
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last ? last[0].toUpperCase() + last.slice(1) : "Dashboard";
}

export default function AdminHeader() {
  const pathname = usePathname() || "/admin";
  const title = pageLabel(pathname);

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-5 lg:px-10">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
          <span className="text-slate-400">Admin</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">{title}</span>
        </div>
        <h2 className="md:hidden text-sm font-bold text-slate-900 truncate">
          {title}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">
        {/* Functional-looking Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all">
          <Search className="w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search Console..."
            className="bg-transparent border-none outline-none text-xs text-slate-900 w-32 lg:w-40 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-50 rounded text-[11px] font-normal uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
