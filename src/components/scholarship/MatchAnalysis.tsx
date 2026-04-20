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
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-600" /> Match Analysis
        </h3>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getScoreBg(percentage)}`}>
          {percentage >= 80 ? "High Match" : percentage >= 60 ? "Good Match" : "Potential Match"}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Progress Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              cx="56"
              cy="56"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={314}
              initial={{ strokeDashoffset: 314 }}
              animate={{ strokeDashoffset: 314 - (314 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              className={getScoreColor(percentage)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Score</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-4">
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            Based on your profile, here is why you are a strong candidate for this scholarship:
          </p>
          <div className="grid gap-3">
            {reasons.map((reason, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 p-1 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-medium text-slate-700">{reason}</p>
              </motion.div>
            ))}
            {reasons.length === 0 && (
              <div className="flex items-start gap-3 text-slate-400 italic">
                <Info className="w-4 h-4 mt-0.5" />
                <p className="text-sm">No specific match details available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
