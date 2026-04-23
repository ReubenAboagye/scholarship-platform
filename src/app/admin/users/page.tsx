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
        <div className="space-y-1">
          <h1 className="text-3xl font-medium text-slate-900 display">User Directory</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Registry & Personnel Management</p>
        </div>

        <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm">
            <Download className="w-3.5 h-3.5" /> 
            <span>Export Registry</span>
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded text-xs uppercase tracking-widest transition-all hover:bg-black active:scale-95 shadow-sm">
            <UserPlus className="w-3.5 h-3.5" /> 
            <span>Add User</span>
          </button>
        </div>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={item} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search personnel records..."
              className="w-full rounded border border-slate-100 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-600 transition hover:bg-slate-50">
              <Filter className="h-3.5 w-3.5" /> 
              <span>Filters</span>
            </button>
            <div className="text-[10px] font-medium text-slate-400 px-4 hidden lg:block uppercase tracking-widest">
              {filtered.length} Entries
            </div>
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
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
               <div className="relative">
                 <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-xs font-medium text-white shadow-sm uppercase">
                   {(u.full_name || u.email)[0].toUpperCase()}
                 </div>
                 {u.role === 'admin' && (
                   <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm">
                     <Shield className="w-2.5 h-2.5 text-white" />
                   </div>
                 )}
               </div>
               
               <div className="min-w-0">
                 <h3 className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                   {u.full_name || "New Explorer"}
                 </h3>
                 <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-0.5">
                   <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                     <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block" />
                   <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                     <MapPin className="w-3 h-3 text-slate-400" /> {u.country_of_origin || "Global"}
                   </span>
                 </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
               <div className="hidden lg:flex flex-col items-end px-4 border-l border-slate-100">
                 <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Enrolled</span>
                 <span className="text-[10px] font-medium text-slate-700 flex items-center gap-1 mt-0.5 uppercase tracking-tight">
                   <Calendar className="w-3 h-3 text-slate-400" />
                   {new Date(u.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                 </span>
               </div>

               <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest border ${
                 u.role === "admin" ? "bg-amber-50 text-amber-600 border-amber-200/50" : "bg-blue-50 text-blue-600 border-blue-200/50"
               }`}>
                 {u.role}
               </span>

               <button className="ml-auto sm:ml-0 w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">No users found matching your criteria</p>
          </div>
        )}
      </motion.div>

      {/* Footer / Pagination Placeholder */}
      <motion.div variants={item} className="flex justify-center border-t border-slate-100 pt-8">
         <button className="text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
           Load more users
         </button>
      </motion.div>
    </motion.div>
  );
}
