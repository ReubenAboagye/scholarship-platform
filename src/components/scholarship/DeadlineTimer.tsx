"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";

interface DeadlineTimerProps {
  deadline: string | null;
}

export default function DeadlineTimer({ deadline }: DeadlineTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);

  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      const distance = new Date(deadline).getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;

  const isPast = new Date(deadline) < new Date();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
        <Clock className="w-3.5 h-3.5 text-brand-600" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Application Window</span>
      </div>

      {isPast ? (
        <div className="space-y-2 mb-4">
          <p className="text-lg font-bold text-rose-500">Applications Closed</p>
          <p className="text-[11px] text-slate-400 font-normal">This scholarship is no longer accepting new applications for the current cycle.</p>
        </div>
      ) : timeLeft ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.mins },
          ].map((unit) => (
            <div key={unit.label} className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center">
              <span className="text-lg font-bold text-slate-900 leading-none">{unit.value}</span>
              <span className="text-[8px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{unit.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-14 animate-pulse bg-slate-50 rounded-xl mb-6" />
      )}

      {/* Mini Visual Timeline */}
      <div className="space-y-4 pt-4 border-t border-slate-50">
        <div className="relative">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
          
          <div className="space-y-5">
            {[
              { label: "Applications Open", date: "Currently Open", status: "completed" },
              { label: "Submission Deadline", date: new Date(deadline).toLocaleDateString(), status: isPast ? "completed" : "active" },
              { label: "Review & Interviews", date: "Post-deadline", status: "pending" },
              { label: "Final Results", date: "TBA", status: "pending" },
            ].map((step, i) => (
              <div key={i} className="relative flex gap-3.5 items-start pl-6">
                <div className={`absolute left-0 w-5 h-5 rounded-full border-[3px] border-white flex items-center justify-center shrink-0 z-10 shadow-xs ${
                  step.status === "completed" ? "bg-emerald-500" : 
                  step.status === "active" ? "bg-brand-500 animate-pulse" : 
                  "bg-slate-200"
                }`}>
                  {step.status === "completed" && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">{step.label}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
