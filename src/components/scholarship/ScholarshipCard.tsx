"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";

// ─────────────────────────────────────────────────────────────
// ScholarshipCard — grid view for the Browse pages.
//
// The whole card is a navigation target: clicking anywhere on
// it goes to the detail page. We use the "stretched link"
// pattern (a single anchor with absolute inset-0 and a span-
// hidden screenreader label) rather than wrapping the entire
// article in an <a>, because nested anchors are invalid HTML
// and we may want clickable affordances inside the card later.
//
// No secondary "Apply" button. The previous version exposed an
// outbound link from the list view, which both bypassed our
// auth gate and pre-empted the natural "read first, then act"
// flow. Apply lives on the detail page where the eligibility
// and deadline are also visible — that's the only place where
// committing to the click makes sense.
// ─────────────────────────────────────────────────────────────

interface ScholarshipCardProps {
  scholarship: any;
  index: number;
  baseUrl?: string;
}

export default function ScholarshipCard({
  scholarship: s,
  index,
  baseUrl = "/scholarships",
}: ScholarshipCardProps) {
  const href = `${baseUrl}/${s.slug || s.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col h-full bg-white border border-slate-200 rounded-lg
                 hover:border-slate-300 hover:shadow-sm transition-all duration-150
                 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-300"
    >
      {/* Stretched link — covers the whole card. Keep it last in
          the DOM so other interactive elements added later layer
          above it via z-index. */}
      <a
        href={href}
        className="absolute inset-0 rounded-lg z-10 focus:outline-none"
        aria-label={`View details for ${s.name}`}
      />

      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* Header: country + funding type (quiet metadata row) */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {countryFlagUrl(s.country) ? (
            <img
              src={countryFlagUrl(s.country)!}
              alt=""
              className="w-5 h-3.5 object-cover rounded-sm border border-slate-200"
            />
          ) : (
            <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />
          )}
          <span className="font-medium">{s.country}</span>
          <span className="text-slate-300">·</span>
          <span>{s.funding_type} funding</span>
        </div>

        {/* Title + provider — title now visually leads, no nested
            anchor needed since the whole card navigates. */}
        <div>
          <h3 className="font-semibold text-slate-900 text-base leading-snug
                         group-hover:text-brand-700 transition-colors line-clamp-2">
            {s.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{s.provider}</span>
          </div>
        </div>

        {/* Description — deliberate 2-line clamp */}
        {s.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {s.description.replace(/^[""\u201c\u201d]|[""\u201c\u201d]$/g, "").trim()}
          </p>
        )}

        {/* Funding amount — visual anchor, no label needed */}
        {s.funding_amount && (
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
            {s.funding_amount}
          </p>
        )}

        {/* Footer: deadline only. No CTAs — the card itself is
            the action. */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100">
          <DeadlineCountdown deadline={s.application_deadline} />
          <span
            className="text-xs font-medium text-slate-400 group-hover:text-brand-700
                       transition-colors"
            aria-hidden="true"
          >
            View details →
          </span>
        </div>
      </div>
    </motion.article>
  );
}
