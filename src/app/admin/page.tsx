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
          <h1 className="text-3xl font-medium text-slate-900 display">Admin Overview</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1.5">Official Management Console</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards Section */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <motion.div
            key={idx}
            className="group relative bg-white border border-slate-200 border-t-4 rounded-lg p-5 shadow-sm transition-all"
            style={{ borderTopColor: s.color === 'blue' ? '#2563eb' : s.color === 'emerald' ? '#10b981' : s.color === 'violet' ? '#8b5cf6' : '#f59e0b' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.1em]">{s.label}</p>
              <div className={`flex items-center gap-1 text-[10px] font-medium ${
                s.trendUp ? "text-emerald-600" : "text-red-600"
              }`}>
                {s.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-medium text-slate-900 tracking-tight">{s.value.toLocaleString()}</h3>
              <div className={`w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Scholarships - Large Column */}
        <motion.div variants={item} className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-medium text-slate-900 uppercase tracking-widest">Recent Postings</h2>
            <Link href="/admin/scholarships" className="text-[10px] font-medium text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {data.recentScholarships?.map((s: any) => (
                <div key={s.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-lg shadow-inner group-hover:bg-white transition-colors">
                    {countryFlag(s.country)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                        <Calendar className="w-3 h-3" /> {formatDeadline(s.application_deadline)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{s.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-medium uppercase tracking-widest ${
                      s.funding_type === "Full" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {s.funding_type}
                    </span>
                    <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
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
        <motion.div variants={item} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-medium text-slate-900 uppercase tracking-widest">New Enrollees</h2>
            <Link href="/admin/users" className="text-[10px] font-medium text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1">
              Directory <Users className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <div className="space-y-1">
              {data.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-[10px] font-medium text-white uppercase">
                      {(u.full_name || u.email)[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{u.full_name || "New Explorer"}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-medium text-slate-900 uppercase tracking-tight">{u.country_of_origin || "Global"}</p>
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5">Joined</p>
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
