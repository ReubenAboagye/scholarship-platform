"use client";

import { motion } from "framer-motion";
import { ExternalLink, Calendar, Building2, ArrowRight } from "lucide-react";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";

interface ScholarshipCardProps {
  scholarship: any;
  index: number;
  baseUrl?: string;
}

const FUNDING_STYLES: Record<string, { label: string; className: string }> = {
  "Full":             { label: "Full Funding",      className: "bg-slate-50 text-slate-600 border border-slate-200" },
  "Partial":          { label: "Partial Funding",   className: "bg-slate-50 text-slate-600 border border-slate-200" },
  "Tuition Only":     { label: "Tuition Only",      className: "bg-slate-50 text-slate-600 border border-slate-200" },
  "Living Allowance": { label: "Living Allowance",  className: "bg-slate-50 text-slate-600 border border-slate-200" },
};

export default function ScholarshipCard({ scholarship: s, index, baseUrl = "/scholarships" }: ScholarshipCardProps) {
  const href = `${baseUrl}/${s.slug ?? s.id}`;
  const funding = FUNDING_STYLES[s.funding_type] ?? { label: s.funding_type, className: "bg-slate-50 text-slate-600 border border-slate-100" };
  const isPast  = s.application_deadline && new Date(s.application_deadline) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col h-full bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="p-5 flex flex-col flex-1">

        {/* Row 1: Flag + country + funding badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {countryFlagUrl(s.country) ? (
              <img src={countryFlagUrl(s.country)!} alt={s.country}
                className="w-7 h-5 object-cover rounded-sm border border-slate-100 shadow-sm" />
            ) : (
              <div className="w-7 h-5 bg-slate-100 rounded-sm" />
            )}
            <span className="text-xs font-semibold text-slate-500 tracking-wide">{s.country}</span>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${funding.className}`}>
            {funding.label}
          </span>
        </div>

        {/* Row 2: Title + provider */}
        <div className="flex-1 mb-4">
          <a href={href} className="block mb-1">
            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
              {s.name}
            </h3>
            </a>
          <div className="flex items-center gap-1.5 text-slate-400 mb-3">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <p className="text-xs text-slate-400 truncate">{s.provider}</p>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {s.description?.replace(/^[""\u201c\u201d]|[""\u201c\u201d]$/g, "").trim()}
          </p>
        </div>

        {/* Row 3: Funding amount — clean text, no emoji */}
        {s.funding_amount && (
          <div className="mb-4 pb-4 border-b border-slate-100">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Award</p>
            <p className="text-sm font-semibold text-slate-700 line-clamp-1">{s.funding_amount}</p>
          </div>
        )}

        {/* Row 4: Deadline + actions */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Deadline
            </p>
            <p className={`text-xs font-semibold ${isPast ? "text-rose-500" : "text-slate-800"}`}>
              {formatDeadline(s.application_deadline)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a href={href}
              className="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </a>
            <a href={s.application_url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-all flex items-center gap-1 active:scale-95">
              Apply <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
