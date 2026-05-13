"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, ChevronRight, Compass, User, Settings, LogOut, ChevronDown, HelpCircle } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const segments = pathname?.split("/").filter(Boolean) || [];
  const currentPage = segments[segments.length - 1] || "dashboard";

  const formatTitle = (str: string) => {
    if (str === "dashboard") return "Overview";
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    setShowLogoutDialog(true);
  }

  async function confirmLogout() {
    setShowLogoutDialog(false);
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  function cancelLogout() {
    setShowLogoutDialog(false);
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-paper flex items-center justify-between px-5 lg:px-10 safe-top min-h-[56px] shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Compass className="size-3.5 text-zinc-300" />
          <span className="text-zinc-500">Dashboard</span>
          {segments.length > 1 && (
            <>
              <ChevronRight className="size-3 text-zinc-300" />
              <span className="text-zinc-900 font-semibold">{formatTitle(currentPage)}</span>
            </>
          )}
        </div>
        <a href="/dashboard" className="sm:hidden flex items-baseline">
          <span className="text-sm tracking-tight text-zinc-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
            Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
          </span>
        </a>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-lg mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            placeholder="Search scholarships, matches…"
            className="w-full h-9 bg-zinc-50/80 border border-zinc-200/60 rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 focus:bg-white transition-all placeholder:text-zinc-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 font-mono text-[10px] font-bold text-zinc-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
        <NotificationCenter />

        <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

        {/* User context */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 hover:bg-zinc-50 rounded-xl px-2 py-1.5 transition-colors"
          >
            <div className="size-9 rounded-xl bg-brand-600 flex items-center justify-center text-[13px] font-black text-white shadow-sm ring-2 ring-white">
              {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
            </div>
            <ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform", userMenuOpen ? "rotate-180" : "")} />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">{profile?.full_name || "User"}</p>
                <p className="text-xs text-zinc-500">{profile?.email}</p>
              </div>
              <div className="py-1">
                <a
                  href="/dashboard/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <User className="size-4 text-zinc-400" />
                  Profile
                </a>
                <a
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Settings className="size-4 text-zinc-400" />
                  Settings
                </a>
                <a
                  href="/help"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <HelpCircle className="size-4 text-zinc-400" />
                  Help & Support
                </a>
              </div>
              <div className="border-t border-zinc-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Logout Confirmation Dialog */}
    {showLogoutDialog && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="size-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Sign out</h3>
            </div>
            <p className="text-sm text-zinc-600 mb-6">
              Are you sure you want to sign out? You&apos;ll need to sign in again to access your account.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
