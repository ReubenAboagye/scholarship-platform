"use client";

import { motion } from "framer-motion";
import { ExternalLink, Calendar, Building2, DollarSign, ArrowRight, MapPin } from "lucide-react";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import ScholarshipRow from "./ScholarshipRow";

interface Props {
  scholarships: any[];
  baseUrl?: string;
}

export default function ScholarshipTable({ scholarships, baseUrl = "/scholarships" }: Props) {
  if (!scholarships?.length) return null;

  return (
    <div className="w-full">
      {/* Mobile-Tablet View: Simplified Card stack */}
      <div className="lg:hidden space-y-4">
        {scholarships.map((s, idx) => (
          <ScholarshipRow key={s.id} scholarship={s} index={idx} baseUrl={baseUrl} />
        ))}
      </div>

      {/* Desktop View: Professional Data Table */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                <th className="sticky top-0 z-10 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">Scholarship</th>
                <th className="sticky top-0 z-10 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">Country</th>
                <th className="sticky top-0 z-10 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 min-w-[180px]">Total Award</th>
                <th className="sticky top-0 z-10 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">Main Deadline</th>
                <th className="sticky top-0 z-10 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scholarships.map((s, idx) => {
                const href = `${baseUrl}/${s.slug || s.id}`;
                const isPast = s.application_deadline && new Date(s.application_deadline) < new Date();
                
                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.99, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1">
                        <a href={href} className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight line-clamp-1 block">
                          {s.name}
                        </a>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium truncate max-w-[200px]">{s.provider}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2.5 mt-0.5">
                        {countryFlagUrl(s.country) ? (
                          <img src={countryFlagUrl(s.country)!} alt={s.country}
                            className="w-5.5 h-3.5 object-cover rounded shadow-sm border border-slate-100" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{s.country}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-black text-slate-800 leading-snug">
                          {s.funding_amount || "Varies"}
                        </span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                            {s.funding_type}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span className={`text-sm font-black ${isPast ? "text-rose-500" : "text-slate-800"}`}>
                          {formatDeadline(s.application_deadline)}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isPast ? "text-rose-400" : "text-slate-400"}`}>
                          {isPast ? "Application Closed" : "Apply Soon"}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-end gap-2.5">
                        <a href={href}
                          className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm active:scale-90"
                          title="View scholarship details"
                        >
                          <ArrowRight className="w-4.5 h-4.5" />
                        </a>
                        <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                          className="px-5 h-10 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg flex items-center gap-2"
                        >
                          Apply <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
