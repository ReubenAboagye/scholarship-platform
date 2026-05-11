"use client";

import { ArrowRight, Building2, Clock, Globe, Zap, RefreshCw } from "lucide-react";
import {
  countryImageUrl,
  opportunityScore,
  opportunityScoreColor,
  opportunityScoreBg,
  fundingBadgeColor,
} from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";

interface FeaturedScholarshipCardProps {
  scholarship: any;
  baseUrl?: string;
}

export default function FeaturedScholarshipCard({
  scholarship: s,
  baseUrl = "/scholarships",
}: FeaturedScholarshipCardProps) {
  const href = `${baseUrl}/${s.slug || s.id}`;
  const score = opportunityScore(s);
  const countryImg = countryImageUrl(s.country);

  const daysLeft = s.application_deadline
    ? Math.ceil((new Date(s.application_deadline).getTime() - Date.now()) / 86_400_000)
    : null;
  const isClosingSoon = daysLeft != null && daysLeft > 0 && daysLeft <= 14;
  const isQuickApply = s.effort_minutes != null && s.effort_minutes <= 60;

  return (
    <article className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-elevated transition-all duration-300">
      <div className="flex flex-col lg:flex-row">
        {/* Image side */}
        <div className="relative lg:w-[45%] min-h-[220px] lg:min-h-[320px] overflow-hidden">
          {countryImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={countryImg}
              alt={s.country}
              className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Floating badge on image */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-brand-800 shadow-sm">
              <Zap className="size-3.5" />
              Featured
            </span>
          </div>

          {/* Country label bottom-left on image */}
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white">
              {s.country}
            </span>
          </div>
        </div>

        {/* Content side */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${fundingBadgeColor(s.funding_type)}`}>
              {s.funding_type} funding
            </span>
            {isClosingSoon && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                <Clock className="size-3" />
                Closing soon
              </span>
            )}
            {s.open_to_international && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                <Globe className="size-3" />
                International
              </span>
            )}
            {isQuickApply && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                <Zap className="size-3" />
                Quick apply
              </span>
            )}
            {s.renewable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                <RefreshCw className="size-3" />
                Renewable
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className="text-2xl lg:text-3xl font-medium text-zinc-900 leading-tight tracking-tight mb-3"
            style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif" }}
          >
            {s.name}
          </h2>

          {/* Provider */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <Building2 className="size-4" />
            <span>{s.provider}</span>
          </div>

          {/* Description */}
          {s.description && (
            <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 mb-6">
              {s.description.replace(/^[""\u201c\u201d]|[""\u201c\u201d]$/g, "").trim()}
            </p>
          )}

          {/* Award */}
          {s.funding_amount && (
            <p className="text-lg font-semibold text-zinc-900 mb-6">
              {s.funding_amount}
            </p>
          )}

          {/* Footer row */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-zinc-100">
            <div className="flex items-center gap-5">
              {/* Deadline */}
              <DeadlineCountdown deadline={s.application_deadline} />

              {/* Opportunity Score */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center size-8 rounded-full text-xs font-bold border ${opportunityScoreBg(score)}`}>
                  {score}
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Score</span>
                  <span className={`text-xs font-medium ${opportunityScoreColor(score)}`}>
                    {score >= 80 ? "Exceptional" : score >= 60 ? "Strong" : score >= 40 ? "Good" : "Fair"}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href={href}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              View details
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
