"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, ExternalLink } from "lucide-react";
import AdminNotificationCenter from "./AdminNotificationCenter";
import AdminCommandPalette from "./AdminCommandPalette";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/scholarships": "Scholarships",
  "/admin/scholarships/new": "New Scholarship",
  "/admin/users": "Users",
  "/admin/analytics": "Analytics",
  "/admin/security/mfa": "MFA Security",
  "/admin/audit": "Audit Log",
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
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K to open command palette
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 min-h-[56px] bg-white/90 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-5 lg:px-10 safe-top">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
          <span className="text-zinc-400">Admin</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900">{title}</span>
        </div>
        <h2 className="md:hidden text-sm text-zinc-900 truncate">
          {title}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">
        {/* Search trigger — opens command palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-400 hover:border-zinc-300 hover:bg-white transition-all"
        >
          <Search className="size-3.5" />
          <span className="text-xs text-zinc-500 w-32 lg:w-40 text-left">Search Console...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        <div className="flex items-center gap-2">
          <AdminNotificationCenter />

          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-zinc-50 rounded text-[11px] font-normal uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <span>Live Site</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
