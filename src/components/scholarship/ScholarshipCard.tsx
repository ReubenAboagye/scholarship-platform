"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Clock, Building2, MapPin } from "lucide-react";
import { countryFlagUrl, formatDeadline, fundingBadgeColor } from "@/lib/utils";

interface ScholarshipCardProps {
  scholarship: any;
  index: number;
}

export default function ScholarshipCard({ scholarship: s, index }: ScholarshipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-ambient hover:shadow-elevated transition-all duration-300"
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Header: Flag & Funding */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              {countryFlagUrl(s.country) ? (
                <img 
                  src={countryFlagUrl(s.country)!} 
                  alt={s.country} 
                  className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" 
                />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-lg">🌍</div>
              )}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${fundingBadgeColor(s.funding_type)}`}>
              {s.funding_type}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{s.country}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Link href={`/scholarships/${s.id}`} className="block group/title">
            <h3 className="font-black text-slate-900 text-lg mb-1 leading-tight group-hover/title:text-brand-600 transition-colors">
              {s.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <Building2 className="w-3.5 h-3.5" />
            <p className="text-xs font-medium">{s.provider}</p>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-6 italic">
            &ldquo;{s.description}&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-slate-50 mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Clock className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">Deadline</span>
            </div>
            <p className={`text-xs font-bold ${
              s.application_deadline && new Date(s.application_deadline) > new Date() 
                ? "text-slate-900" 
                : "text-rose-500"
            }`}>
              {formatDeadline(s.application_deadline)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link 
              href={`/scholarships/${s.id}`} 
              className="text-xs font-bold px-4 py-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              Details
            </Link>
            <a 
              href={s.application_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-all shadow-sm hover:shadow-brand-glow flex items-center gap-1.5 active:scale-95"
            >
              Apply <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
