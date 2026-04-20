"use client";

import { CheckCircle2, XCircle, HelpCircle, User, Award } from "lucide-react";
import { motion } from "framer-motion";

export interface EligibilityItem {
  label: string;
  requirement: string | number | string[];
  userValue: string | number | string[] | null | undefined;
  isMatch: boolean | "partial" | "unknown";
}

interface EligibilityComparisonProps {
  items: EligibilityItem[];
}

export default function EligibilityComparison({ items }: EligibilityComparisonProps) {
  return (
    <div className="space-y-3">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-brand-600" /> Eligibility Checklist
        </h3>
      </div>
      
      <div className="divide-y divide-slate-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-1 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
          <div className="col-span-5">Criteria</div>
          <div className="col-span-4">Requirement</div>
          <div className="col-span-3 text-right">Your Profile</div>
        </div>

        {/* Items */}
        {items.map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-12 gap-4 px-1 py-2.5 items-center hover:bg-slate-50/30 transition-colors"
          >
            <div className="col-span-5 flex items-center gap-2.5">
              <div className={`p-1 rounded-lg shrink-0 ${
                item.isMatch === true ? "bg-emerald-50 text-emerald-600" : 
                item.isMatch === false ? "bg-rose-50 text-rose-600" : 
                "bg-amber-50 text-amber-600"
              }`}>
                {item.isMatch === true ? <CheckCircle2 className="w-3 h-3" /> : 
                 item.isMatch === false ? <XCircle className="w-3 h-3" /> : 
                 <HelpCircle className="w-3 h-3" />}
              </div>
              <span className="text-[13px] font-semibold text-slate-700 leading-tight">{item.label}</span>
            </div>
            
            <div className="col-span-4">
              <span className="text-[11px] font-semibold text-slate-500 truncate block leading-tight">
                {Array.isArray(item.requirement) ? item.requirement.join(", ") : item.requirement || "None"}
              </span>
            </div>

            <div className="col-span-3 text-right">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                <User className="w-2.5 h-2.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-700">
                  {item.userValue === null || item.userValue === undefined || (Array.isArray(item.userValue) && item.userValue.length === 0) 
                    ? "---" 
                    : Array.isArray(item.userValue) ? item.userValue[0] : item.userValue}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-3 mt-4">
        <p className="text-[10px] text-slate-400 font-normal italic">
          * Matching is indicative. Verify details official portal.
        </p>
      </div>
    </div>
  );
}
