"use client";

import { CheckCircle2, Info, Target } from "lucide-react";
import { motion } from "framer-motion";

interface MatchAnalysisProps {
  score: number;
  reasons: string[];
}

export default function MatchAnalysis({ score, reasons }: MatchAnalysisProps) {
  // Normalize score to percentage if it's 0-1
  const percentage = Math.min(Math.round(score > 1 ? score : score * 100), 100);

  const getScoreColor = (p: number) => {
    if (p >= 80) return "text-emerald-600 stroke-emerald-600";
    if (p >= 60) return "text-brand-600 stroke-brand-600";
    return "text-amber-600 stroke-amber-600";
  };

  const getScoreBg = (p: number) => {
    if (p >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (p >= 60) return "bg-brand-50 text-brand-700 border-brand-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-brand-600" /> Match Analysis
        </h3>
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getScoreBg(percentage)}`}>
          {percentage >= 80 ? "High Match" : percentage >= 60 ? "Good Match" : "Potential Match"}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Progress Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={276}
              initial={{ strokeDashoffset: 276 }}
              animate={{ strokeDashoffset: 276 - (276 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              className={getScoreColor(percentage)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${getScoreColor(percentage)} leading-none`}>{percentage}%</span>
            <span className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Score</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-3">
          <p className="text-[13px] text-slate-500 leading-snug font-normal">
            Based on your profile, here is why you match:
          </p>
          <div className="grid gap-2">
            {reasons.map((reason, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 p-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <p className="text-[13px] font-medium text-slate-700 leading-tight">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
