"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Search, MoreVertical, Mail, MapPin, Calendar, Shield, UserPlus, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = users.filter((u) => 
    !search || 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-slate-200 rounded-lg" />
        <div className="h-20 bg-slate-200 rounded-[2rem]" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-[1.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Manage your community, monitor activity, and assign administrative roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm transition-all hover:bg-slate-50 active:scale-95 shadow-sm">
            <Download className="w-4 h-4" /> 
            <span>Export CSV</span>
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm transition-all hover:bg-black active:scale-95 shadow-lg shadow-black/10">
            <UserPlus className="w-4 h-4" /> 
            <span>Add User</span>
          </button>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={item} className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or country..."
              className="w-full rounded-2xl border border-transparent bg-slate-100/80 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              <Filter className="h-4 w-4" /> 
              <span>Filters</span>
            </button>
            <div className="text-sm font-bold text-slate-400 px-4 hidden lg:block">
              {filtered.length} Users
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Listing */}
      <motion.div variants={item} className="space-y-3">
        {filtered.map((u) => (
          <motion.div 
            key={u.id}
            layout
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
               <div className="relative">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg group-hover:scale-105 transition-transform">
                   {(u.full_name || u.email)[0].toUpperCase()}
                 </div>
                 {u.role === 'admin' && (
                   <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm">
                     <Shield className="w-3 h-3 text-white" />
                   </div>
                 )}
               </div>
               
               <div className="min-w-0">
                 <h3 className="text-base font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                   {u.full_name || "New Explorer"}
                 </h3>
                 <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
                   <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                     <Mail className="w-3 h-3" /> {u.email}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block" />
                   <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                     <MapPin className="w-3 h-3" /> {u.country_of_origin || "Global"}
                   </span>
                 </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
               <div className="hidden lg:flex flex-col items-end px-4 border-l border-slate-100">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</span>
                 <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                   <Calendar className="w-3 h-3 text-blue-500" />
                   {new Date(u.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                 </span>
               </div>

               <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                 u.role === "admin" ? "bg-amber-50 text-amber-600 border border-amber-200/50" : "bg-blue-50 text-blue-600 border border-blue-200/50"
               }`}>
                 {u.role}
               </span>

               <button className="ml-auto sm:ml-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                 <MoreVertical className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users found matching your criteria</p>
          </div>
        )}
      </motion.div>

      {/* Footer / Pagination Placeholder */}
      <motion.div variants={item} className="flex justify-center border-t border-slate-100 pt-8">
         <button className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
           Load more users
         </button>
      </motion.div>
    </motion.div>
  );
}
