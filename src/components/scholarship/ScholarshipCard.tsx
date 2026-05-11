"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Building2, Clock, Globe, Zap, RefreshCw } from "lucide-react";
import {
  countryImageUrl,
  opportunityScore,
  opportunityScoreBg,
  fundingBadgeColor,
} from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";

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
  const score = opportunityScore(s);
  const countryImg = countryImageUrl(s.country);

  const daysLeft = s.application_deadline
    ? Math.ceil((new Date(s.application_deadline).getTime() - Date.now()) / 86_400_000)
    : null;
  const isClosingSoon = daysLeft != null && daysLeft > 0 && daysLeft <= 14;
  const isQuickApply = s.effort_minutes != null && s.effort_minutes <= 60;

  return (
    <LazyMotion features={domAnimation}>
      <m.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="group relative flex flex-col h-full bg-white border border-zinc-200 rounded-xl
                   hover:border-zinc-300 hover:shadow-card-hover transition-all duration-200
                   focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-300 overflow-hidden"
      >
        {/* Stretched link */}
        <a
          href={href}
          className="absolute inset-0 z-10 focus:outline-none"
          aria-label={`View details for ${s.name}`}
        />

        {/* Country image banner */}
        <div className="relative h-24 overflow-hidden">
          {countryImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={countryImg}
              alt={s.country}
              className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-800 to-brand-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Score badge — top right */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className={`inline-flex items-center justify-center size-7 rounded-full text-[11px] font-bold border shadow-sm ${opportunityScoreBg(score)}`}>
              {score}
            </span>
          </div>

          {/* Country label */}
          <div className="absolute bottom-2.5 left-3 z-20">
            <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider">
              {s.country}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-3.5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${fundingBadgeColor(s.funding_type)}`}>
              {s.funding_type}
            </span>
            {isClosingSoon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-100">
                <Clock className="size-3" />
                Closing soon
              </span>
            )}
            {s.open_to_international && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100">
                <Globe className="size-3" />
                Intl.
              </span>
            )}
            {isQuickApply && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-100">
                <Zap className="size-3" />
                Quick
              </span>
            )}
            {s.renewable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                <RefreshCw className="size-3" />
                Renew
              </span>
            )}
          </div>

          {/* Title + provider */}
          <div>
            <h3 className="font-semibold text-zinc-900 text-[15px] leading-snug
                           group-hover:text-brand-700 transition-colors line-clamp-2">
              {s.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{s.provider}</span>
            </div>
          </div>

          {/* Description */}
          {s.description && (
            <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">
              {s.description.replace(/^[""\u201c\u201d]|[""\u201c\u201d]$/g, "").trim()}
            </p>
          )}

          {/* Funding amount */}
          {s.funding_amount && (
            <p className="text-sm font-semibold text-zinc-900 line-clamp-1">
              {s.funding_amount}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-zinc-100">
            <DeadlineCountdown deadline={s.application_deadline} />
            <span
              className="text-xs font-medium text-zinc-400 group-hover:text-brand-700
                         transition-colors"
              aria-hidden="true"
            >
              View details →
            </span>
          </div>
        </div>
      </m.article>
    </LazyMotion>
  );
}
