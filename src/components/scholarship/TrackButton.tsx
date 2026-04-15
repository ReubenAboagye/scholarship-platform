"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ListChecks, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = [
  "Interested",
  "In Progress",
  "Submitted",
  "Awaiting Decision",
  "Accepted",
  "Rejected",
  "Withdrawn",
] as const;

interface Props {
  scholarshipId: string;
  userId: string;
  initialStatus: string | null;
  /** Pass true when rendered on a dark/image hero background */
  variant?: "hero" | "default";
}

export default function TrackButton({ scholarshipId, userId, initialStatus, variant = "default" }: Props) {
  const [status,  setStatus]  = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const isTracked = status !== null;

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 6,
      left:  rect.left   + window.scrollX,
      width: Math.max(rect.width, 200),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  async function pickStatus(newStatus: string) {
    setLoading(true);
    setOpen(false);
    const supabase = createClient();
    if (isTracked) {
      await supabase.from("application_tracker")
        .update({ status: newStatus })
        .eq("user_id", userId)
        .eq("scholarship_id", scholarshipId);
    } else {
      await supabase.from("application_tracker")
        .upsert({ user_id: userId, scholarship_id: scholarshipId, status: newStatus });
    }
    setStatus(newStatus);
    setLoading(false);
  }

  async function removeFromTracker() {
    setLoading(true);
    setOpen(false);
    const supabase = createClient();
    await supabase.from("application_tracker")
      .delete()
      .eq("user_id", userId)
      .eq("scholarship_id", scholarshipId);
    setStatus(null);
    setLoading(false);
  }

  const heroTracked   = "bg-white/25 backdrop-blur-sm border border-white/40 text-white hover:bg-white/35";
  const heroUntracked = "bg-white/10 backdrop-blur-sm border border-white/25 text-white/90 hover:bg-white/20 hover:border-white/40";
  const defTracked    = "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100";
  const defUntracked  = "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700";

  const btnStyle = variant === "hero"
    ? (isTracked ? heroTracked : heroUntracked)
    : (isTracked ? defTracked  : defUntracked);

  const dropdown = open ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="absolute z-[9999] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
      >
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isTracked ? "Update status" : "Start tracking as"}
          </p>
        </div>
        <div className="py-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => pickStatus(s)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                status === s
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {status === s
                ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                : <span className="w-3.5" />}
              {s}
            </button>
          ))}
        </div>
        {isTracked && (
          <div className="border-t border-slate-100 py-1">
            <button
              onClick={removeFromTracker}
              className="w-full text-left px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
            >
              Remove from tracker
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${btnStyle}`}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isTracked
            ? <CheckCircle className="w-4 h-4" />
            : <ListChecks className="w-4 h-4" />}
        {isTracked ? status : "Track"}
        {!loading && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {dropdown}
    </>
  );
}
