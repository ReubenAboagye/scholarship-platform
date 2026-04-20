import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";

interface ScholarshipSummary {
  id: string;
  name: string;
  slug: string;
  country: string;
  funding_type: string;
}

interface SimilarScholarshipsProps {
  scholarships: ScholarshipSummary[];
}

export default function SimilarScholarships({ scholarships }: SimilarScholarshipsProps) {
  if (!scholarships || scholarships.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Similar Scholarships
        </h3>
      </div>
      
      <div className="space-y-2">
        {scholarships.map((s) => (
          <Link 
            key={s.id} 
            href={`/dashboard/scholarships/${s.slug || s.id}`}
            className="group flex items-center gap-4 p-2 rounded-2xl hover:bg-slate-50 transition-all"
          >
            <div className="relative w-10 h-8 shrink-0">
              {countryFlagUrl(s.country) ? (
                <img 
                  src={countryFlagUrl(s.country)!} 
                  alt={s.country}
                  className="w-full h-full object-cover rounded border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded border border-slate-100" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                {s.name}
              </p>
              <p className="text-[10px] font-normal text-slate-400 capitalize">
                {s.funding_type} • {s.country}
              </p>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-50 text-center">
        <Link 
          href="/dashboard/scholarships"
          className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600 inline-flex"
        >
          View all scholarships
        </Link>
      </div>
    </div>
  );
}
