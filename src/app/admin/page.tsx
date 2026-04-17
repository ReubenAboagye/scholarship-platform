"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Users, ListChecks, Bookmark, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";
import { countryFlag, formatDeadline } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [
        { count: totalUsers },
        { count: totalScholarships },
        { count: totalTracked },
        { count: totalSaved },
        { data: recentScholarships },
        { data: recentUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("scholarships").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("application_tracker").select("*", { count: "exact", head: true }),
        supabase.from("saved_scholarships").select("*", { count: "exact", head: true }),
        supabase.from("scholarships").select("id, name, country, funding_type, application_deadline, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, email, created_at, country_of_origin").order("created_at", { ascending: false }).limit(5),
      ]);

      setData({
        totalUsers: totalUsers ?? 0,
        totalScholarships: totalScholarships ?? 0,
        totalTracked: totalTracked ?? 0,
        totalSaved: totalSaved ?? 0,
        recentScholarships,
        recentUsers,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users",        value: data.totalUsers,        icon: Users,      color: "blue",    trend: "+12.5%", trendUp: true },
    { label: "Active Scholarships", value: data.totalScholarships, icon: BookOpen,   color: "emerald", trend: "+4.2%",  trendUp: true },
    { label: "Applications",       value: data.totalTracked,      icon: ListChecks, color: "violet",  trend: "-2.1%",  trendUp: false },
    { label: "Saved Items",        value: data.totalSaved,        icon: Bookmark,   color: "amber",   trend: "+8.4%",  trendUp: true },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-600 font-medium">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards Section */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden"
          >
            {/* Decorative Background Blur */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${
              s.color === "blue" ? "bg-blue-600" : 
              s.color === "emerald" ? "bg-emerald-600" : 
              s.color === "violet" ? "bg-violet-600" : "bg-amber-600"
            }`} />

            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                s.color === "blue" ? "bg-blue-50 text-blue-600" : 
                s.color === "emerald" ? "bg-emerald-50 text-emerald-600" : 
                s.color === "violet" ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"
              }`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                s.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {s.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{s.value.toLocaleString()}</h3>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">View Details</span>
              <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Scholarships - Large Column */}
        <motion.div variants={item} className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Scholarships</h2>
            <Link href="/admin/scholarships" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group">
              Manage All <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {data.recentScholarships?.map((s: any) => (
                <div key={s.id} className="group flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white transition-colors">
                    {countryFlag(s.country)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDeadline(s.application_deadline)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{s.country}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      s.funding_type === "Full" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {s.funding_type}
                    </span>
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/scholarships" className="block w-full py-4 text-center text-sm font-bold text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all border-t border-slate-100">
              Show all activities
            </Link>
          </div>
        </motion.div>

        {/* Recent Users - Side Column */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">New Users</h2>
            <Link href="/admin/users" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group flex items-center gap-1">
              Directory <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-2 shadow-sm">
            <div className="space-y-1">
              {data.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-[1.8rem] hover:bg-slate-50 transition-all group">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                      {(u.full_name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.full_name || "New Explorer"}</p>
                    <p className="text-xs font-medium text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">{u.country_of_origin || "Global"}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Just joined</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Link({ href, children, target, className }: { href: string; children: React.ReactNode; target?: string; className?: string }) {
  return (
    <a href={href} target={target} className={className}>
      {children}
    </a>
  );
}
