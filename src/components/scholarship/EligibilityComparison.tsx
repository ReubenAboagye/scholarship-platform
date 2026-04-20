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
    <div className="space-y-4">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-600" /> Eligibility Checklist
        </h3>
      </div>
      
      <div className="divide-y divide-slate-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
            className="grid grid-cols-12 gap-4 px-2 py-4 items-center hover:bg-slate-50/30 transition-colors"
          >
            <div className="col-span-5 flex items-center gap-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                item.isMatch === true ? "bg-emerald-50 text-emerald-600" : 
                item.isMatch === false ? "bg-rose-50 text-rose-600" : 
                "bg-amber-50 text-amber-600"
              }`}>
                {item.isMatch === true ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                 item.isMatch === false ? <XCircle className="w-3.5 h-3.5" /> : 
                 <HelpCircle className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold text-slate-700">{item.label}</span>
            </div>
            
            <div className="col-span-4">
              <span className="text-xs font-semibold text-slate-500 truncate block">
                {Array.isArray(item.requirement) ? item.requirement.join(", ") : item.requirement || "None"}
              </span>
            </div>

            <div className="col-span-3 text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <User className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {item.userValue === null || item.userValue === undefined || (Array.isArray(item.userValue) && item.userValue.length === 0) 
                    ? "---" 
                    : Array.isArray(item.userValue) ? item.userValue[0] : item.userValue}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 mt-6">
        <p className="text-[11px] text-slate-400 font-normal italic">
          * Matching is indicative. Verify details on the provider's official portal.
        </p>
      </div>
    </div>
  );
}
