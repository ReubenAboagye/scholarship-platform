"use client";

import { motion } from "framer-motion";
import { ExternalLink, Calendar, Building2, DollarSign } from "lucide-react";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";

interface Props {
  scholarship: any;
  index: number;
  baseUrl?: string;
}

export default function ScholarshipRow({ scholarship: s, index, baseUrl = "/scholarships" }: Props) {
  const href = `${baseUrl}/${s.slug || s.id}`;
  const isPast = s.application_deadline && new Date(s.application_deadline) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 sm:p-4.5 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
        
        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {countryFlagUrl(s.country) && (
              <img src={countryFlagUrl(s.country)!} alt={s.country}
                className="w-6 h-4 object-cover rounded shadow-sm border border-slate-100 flex-shrink-0" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.country}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <p className="text-xs truncate max-w-[200px]">{s.provider}</p>
            </div>
          </div>
          <a href={href} className="block">
            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition-colors line-clamp-1">
              {s.name}
            </h3>
          </a>
        </div>

        {/* Metadata Details */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-10 lg:px-10 lg:border-l lg:border-r lg:border-slate-100">
          <div className="min-w-[120px]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <DollarSign className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Award amount</span>
            </div>
            <p className="text-sm font-bold text-slate-700 whitespace-nowrap truncate max-w-[140px]">{s.funding_amount || "Varies"}</p>
          </div>
          
          <div className="min-w-[100px]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Deadline</span>
            </div>
            <p className={`text-sm font-bold whitespace-nowrap ${isPast ? "text-rose-500" : "text-slate-700"}`}>
              {formatDeadline(s.application_deadline)}
            </p>
          </div>
        </div>

        {/* Static horizontal Actions */}
        <div className="flex items-center gap-2.5 ml-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-0 border-slate-50 lg:w-auto w-full justify-end">
          <a href={href} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-95">
            Details
          </a>
          <a href={s.application_url} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-lg shadow-brand-100 active:scale-95">
            Apply <ExternalLink className="w-3.5 h-3.5 text-white/70" />
          </a>
        </div>

      </div>
    </motion.div>
  );
}
