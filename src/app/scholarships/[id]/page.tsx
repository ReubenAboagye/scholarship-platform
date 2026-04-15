import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import { ArrowLeft, ExternalLink, CheckCircle, Calendar, DollarSign, MapPin, GraduationCap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SaveButton from "@/components/scholarship/SaveButton";
import TrackButton from "@/components/scholarship/TrackButton";

// One distinct Unsplash image per destination — university / city landmark feel
const COUNTRY_IMAGES: Record<string, string> = {
  UK:      "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=1600&q=80&auto=format&fit=crop", // Oxford
  USA:     "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80&auto=format&fit=crop", // campus
  Germany: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&q=80&auto=format&fit=crop", // Berlin
  Canada:  "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1600&q=80&auto=format&fit=crop", // Toronto CN Tower
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80&auto=format&fit=crop";

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Support both readable slugs (e.g. "chevening-scholarship") and legacy UUIDs
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: scholarship } = isUuid
    ? await supabase.from("scholarships").select("*").eq("id", id).single()
    : await supabase.from("scholarships").select("*").eq("slug", id).single();
  if (!scholarship) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: saved }, { data: tracked }] = user
    ? await Promise.all([
        supabase.from("saved_scholarships").select("id").eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
        supabase.from("application_tracker").select("status").eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
      ])
    : [{ data: null }, { data: null }];
  const heroImage = COUNTRY_IMAGES[scholarship.country] ?? FALLBACK_IMAGE;
  const isPast = scholarship.application_deadline && new Date(scholarship.application_deadline) < new Date();

  const infoCards = [
    { icon: DollarSign,    label: "Funding",       value: scholarship.funding_type },
    { icon: GraduationCap, label: "Degree Levels", value: scholarship.degree_levels?.join(", ") || "Any" },
    { icon: Calendar,      label: "Deadline",      value: formatDeadline(scholarship.application_deadline) },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "320px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Gradient: transparent top → dark bottom so content is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/75" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Back link */}
          <Link href="/scholarships"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to scholarships
          </Link>

          {/* Flag + funding badge */}
          <div className="flex items-center gap-3 mb-4">
            {countryFlagUrl(scholarship.country) && (
              <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                className="w-9 h-6 object-cover rounded border border-white/20 shadow-md" />
            )}
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 text-white rounded-md">
              {scholarship.funding_type} Funding
            </span>
            {isPast && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500/80 text-white rounded-md">
                Closed
              </span>
            )}
          </div>

          {/* Title + provider */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-2">
            {scholarship.name}
          </h1>
          <p className="text-white/70 text-sm mb-8">{scholarship.provider}</p>

          {/* Stat strip */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: MapPin,        label: scholarship.country },
              { icon: DollarSign,    label: scholarship.funding_type },
              { icon: GraduationCap, label: scholarship.degree_levels?.join(", ") || "Any level" },
              { icon: Calendar,      label: formatDeadline(scholarship.application_deadline) },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2">
                <Icon className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white text-xs font-medium">{label}</span>
              </div>
            ))}
            {user && (
              <div className="ml-auto flex items-center gap-2">
                <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} variant="hero" />
                <TrackButton scholarshipId={scholarship.id} userId={user.id} initialStatus={(tracked as any)?.status ?? null} variant="hero" />
              </div>
            )}
          </div>
        </div>
      </section>
      {/* ── END HERO ─────────────────────────────────────────── */}

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── LEFT: article ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* About */}
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-3">About this Scholarship</h2>
              <p className="text-slate-600 text-[15px] leading-[1.85]">{scholarship.description}</p>
            </section>

            <hr className="border-slate-100" />

            {/* Eligibility */}
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-5">Eligibility Criteria</h2>
              <ul className="space-y-4">
                {scholarship.eligibility_criteria?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-3.5">
                    <span className="mt-[3px] flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    </span>
                    <span className="text-[15px] text-slate-600 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            {scholarship.fields_of_study?.length > 0 && scholarship.fields_of_study[0] !== "Any" && (
              <>
                <hr className="border-slate-100" />
                <section>
                  <h2 className="text-base font-bold text-slate-900 mb-4">Fields of Study</h2>
                  <div className="flex flex-wrap gap-2">
                    {scholarship.fields_of_study.map((f: string) => (
                      <span key={f} className="text-sm px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-600 font-medium rounded-lg">
                        {f}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            )}

            <hr className="border-slate-100" />

            {/* How to Apply — no card, plain content */}
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-3">How to Apply</h2>
              <p className="text-slate-600 text-[15px] leading-[1.85] mb-5">
                Applications are submitted directly through the official scholarship portal. Make sure you have all required documents ready — including transcripts, references, and a personal statement — before starting your application.
              </p>
              <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Go to official application <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </section>

          </div>

          {/* ── RIGHT: sticky fact card ─────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Quick Facts</p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <MapPin className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Country</p>
                    <div className="flex items-center gap-1.5">
                      {countryFlagUrl(scholarship.country) && (
                        <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                          className="w-4 h-3 object-cover rounded-sm border border-slate-100" />
                      )}
                      <p className="text-sm font-semibold text-slate-900">{scholarship.country}</p>
                    </div>
                  </div>
                </div>
                {infoCards.map((card) => (
                  <div key={card.label} className="flex items-center gap-3 px-5 py-3.5">
                    <card.icon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">{card.label}</p>
                      <p className={`text-sm font-semibold truncate ${card.label === "Deadline" && isPast ? "text-rose-500" : "text-slate-900"}`}>
                        {card.value}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-4 bg-slate-50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Award</p>
                  <p className="text-sm font-bold text-slate-900 leading-snug">{scholarship.funding_amount}</p>
                </div>
              </div>
            </div>
            <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors text-sm rounded-xl shadow-md active:scale-95">
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
            {!user && (
              <Link href="/auth/signup"
                className="flex items-center justify-center w-full py-3 border border-slate-200 hover:border-slate-300 text-slate-600 font-medium transition-colors text-sm rounded-xl">
                Sign in to Save & Track
              </Link>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
