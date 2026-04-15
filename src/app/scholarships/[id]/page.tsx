import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import { ArrowLeft, ExternalLink, CheckCircle, Calendar, DollarSign, MapPin, GraduationCap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SaveButton from "@/components/scholarship/SaveButton";

// One distinct Unsplash image per destination — university / city landmark feel
const COUNTRY_IMAGES: Record<string, string> = {
  UK:      "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=1600&q=80&auto=format&fit=crop", // Oxford
  USA:     "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80&auto=format&fit=crop", // campus
  Germany: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&q=80&auto=format&fit=crop", // Berlin
  Canada:  "https://images.unsplash.com/photo-1569038786784-e5716d5b14df?w=1600&q=80&auto=format&fit=crop", // Toronto
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80&auto=format&fit=crop";

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: scholarship } = await supabase.from("scholarships").select("*").eq("id", id).single();
  if (!scholarship) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: saved } = user
    ? await supabase.from("saved_scholarships").select("id").eq("user_id", user.id).eq("scholarship_id", id).single()
    : { data: null };

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
              <div className="ml-auto">
                <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} />
              </div>
            )}
          </div>
        </div>
      </section>
      {/* ── END HERO ─────────────────────────────────────────── */}

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-400">About this scholarship</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{scholarship.description}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-400">Eligibility Criteria</h2>
              <ul className="space-y-2.5">
                {scholarship.eligibility_criteria?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {scholarship.fields_of_study?.length > 0 && scholarship.fields_of_study[0] !== "Any" && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-400">Fields of Study</h2>
                <div className="flex flex-wrap gap-2">
                  {scholarship.fields_of_study.map((f: string) => (
                    <span key={f} className="text-xs px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600 font-medium rounded-md">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              {/* Country */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Country</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {countryFlagUrl(scholarship.country) && (
                      <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                        className="w-4 h-3 object-cover rounded-sm border border-slate-100" />
                    )}
                    <p className="text-sm font-semibold text-slate-900">{scholarship.country}</p>
                  </div>
                </div>
              </div>
              {/* Other info rows */}
              {infoCards.map((card) => (
                <div key={card.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{card.label}</p>
                    <p className={`text-sm font-semibold ${card.label === "Deadline" && isPast ? "text-rose-500" : "text-slate-900"}`}>
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
              {/* Funding amount */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Award</p>
                <p className="text-sm font-semibold text-slate-900">{scholarship.funding_amount}</p>
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
