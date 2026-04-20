"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import DeadlineCountdown from "./DeadlineCountdown";

// ─────────────────────────────────────────────────────────────
// ScholarshipStickyBar — always-visible header on detail pages.
// Appears after the hero scrolls past ~280px. Contains back
// link, scholarship name, deadline countdown, and primary apply
// CTA. Provides consistent access to the conversion action
// regardless of scroll depth.
// ─────────────────────────────────────────────────────────────

export default function ScholarshipStickyBar({
  name,
  country,
  deadline,
  applicationUrl,
  backHref = "/dashboard/scholarships",
  isPast,
}: {
  name: string;
  country: string;
  deadline: string | null;
  applicationUrl: string;
  backHref?: string;
  isPast: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 280);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur
        transition-all duration-200
        ${visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-3">
          <a
            href={backHref}
            aria-label="Back to scholarships"
            className="shrink-0 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{country}</span>
              <span className="text-slate-300">·</span>
              <DeadlineCountdown deadline={deadline} />
            </div>
          </div>

          <a
            href={isPast ? undefined : applicationUrl}
            target={isPast ? undefined : "_blank"}
            rel={isPast ? undefined : "noopener noreferrer"}
            aria-disabled={isPast}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
              ${isPast
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-brand-600 text-white hover:bg-brand-700"}`}
          >
            {isPast ? "Closed" : "Apply"}
            {!isPast && <ExternalLink className="w-3.5 h-3.5" />}
          </a>
        </div>
      </div>
    </div>
  );
}
