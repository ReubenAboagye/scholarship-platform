"use client";

import { useState, useEffect } from "react";
import { GraduationCap, LayoutDashboard, BookOpen, Users, BarChart3, LogOut, Shield, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [pathname, setPathname] = useState("");
  useEffect(() => { setPathname(window.location.pathname); }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/5 flex-shrink-0 relative overflow-hidden">
      {/* Visual Depth Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      
      {/* Logo Section */}
      <div className="relative px-6 py-8">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-white leading-none tracking-tight">
              Scholar<span className="text-blue-400">Match</span>
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3 text-amber-400/80" />
              <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 relative">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3 z-10">
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )} />
                <span>{item.label}</span>
              </div>

              {active && (
                <>
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/5 border border-blue-500/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </>
              )}

              {!active && (
                <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              )}
            </a>
          );
        })}
      </nav>

      {/* User Section / Bottom Navigation */}
      <div className="relative mt-auto p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-inner">
              {(profile.full_name || profile.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{profile.full_name || "Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate font-medium">{profile.email}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
