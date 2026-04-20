import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Calendar, MapPin, GraduationCap, Building2, Share2, Info, Trophy, Target } from "lucide-react";
import SaveButton from "@/components/scholarship/SaveButton";
import TrackButton from "@/components/scholarship/TrackButton";
import MatchAnalysis from "@/components/scholarship/MatchAnalysis";
import EligibilityComparison, { EligibilityItem } from "@/components/scholarship/EligibilityComparison";
import DeadlineTimer from "@/components/scholarship/DeadlineTimer";
import SimilarScholarships from "@/components/scholarship/SimilarScholarships";
import FadeIn from "@/components/ui/FadeIn";

export default async function DashboardScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: scholarship } = isUuid
    ? await supabase.from("scholarships").select("*").eq("id", id).single()
    : await supabase.from("scholarships").select("*").eq("slug", id).single();
  
  if (!scholarship) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [profileResult, savedResult, trackedResult] = user
    ? await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("saved_scholarships").select("id").eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
        supabase.from("application_tracker").select("status").eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const profile = profileResult.data;
  const saved = savedResult.data;
  const tracked = trackedResult.data;

  // Fetch similar scholarships
  const { data: similarRaw } = scholarship.embedding 
    ? await supabase.rpc('match_scholarships_gated', {
        query_embedding: scholarship.embedding,
        match_count: 4
      })
    : { data: [] };
  
  const similar = (similarRaw as any[])?.filter(s => s.id !== scholarship.id).slice(0, 3) || [];

  const isPast = scholarship.application_deadline && new Date(scholarship.application_deadline) < new Date();

  // Match Analysis Logic
  const matchReasons: string[] = [];
  let hardGateCount = 0;
  let totalGates = 0;

  if (profile) {
    // Degree Level
    totalGates++;
    const degreeMatch = !scholarship.degree_levels || scholarship.degree_levels.length === 0 || scholarship.degree_levels.includes("Any") || (profile.degree_level && scholarship.degree_levels.includes(profile.degree_level));
    if (degreeMatch) {
      matchReasons.push(`Matches your ${profile.degree_level || 'current'} degree level`);
      hardGateCount++;
    }

    // GPA
    if (scholarship.min_gpa) {
      totalGates++;
      if (profile.gpa && profile.gpa >= scholarship.min_gpa) {
        matchReasons.push(`Your GPA (${profile.gpa}) meets the ${scholarship.min_gpa} minimum`);
        hardGateCount++;
      }
    }

    // Country
    totalGates++;
    if (scholarship.country) {
      matchReasons.push(`Located in ${scholarship.country}, one of your target regions`);
      hardGateCount++;
    }
    
    // Citizenship (Simplified)
    if (scholarship.citizenship_required && scholarship.citizenship_required.length > 0) {
      totalGates++;
      const citizenMatch = profile.citizenship && scholarship.citizenship_required.some((c: string) => profile.citizenship.toLowerCase().includes(c.toLowerCase()));
      if (citizenMatch) {
        matchReasons.push(`Your citizenship (${profile.citizenship}) is eligible`);
        hardGateCount++;
      }
    }
  }

  const calculatedScore = totalGates > 0 ? (hardGateCount / totalGates) * 100 : 75;

  const eligibilityItems: EligibilityItem[] = [
    { 
      label: "Degree Level", 
      requirement: scholarship.degree_levels?.join(", ") || "Any", 
      userValue: profile?.degree_level,
      isMatch: !scholarship.degree_levels || scholarship.degree_levels.includes("Any") || (profile?.degree_level && scholarship.degree_levels.includes(profile.degree_level)) ? true : (profile?.degree_level ? false : "unknown")
    },
    { 
      label: "Minimum GPA", 
      requirement: scholarship.min_gpa || "No minimum", 
      userValue: profile?.gpa,
      isMatch: !scholarship.min_gpa ? true : (profile?.gpa && profile.gpa >= scholarship.min_gpa ? true : (profile?.gpa ? false : "unknown"))
    },
    { 
      label: "Citizenship", 
      requirement: scholarship.citizenship_required?.length > 0 ? scholarship.citizenship_required.join(", ") : "Open to all", 
      userValue: profile?.citizenship,
      isMatch: !scholarship.citizenship_required || scholarship.citizenship_required.length === 0 ? true : (profile?.citizenship && scholarship.citizenship_required.some((c: string) => profile.citizenship.toLowerCase().includes(c.toLowerCase())) ? true : (profile?.citizenship ? false : "unknown"))
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
      
      {/* Breadcrumbs & Actions */}
      <FadeIn direction="down" className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard/scholarships"
            className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-all hover:shadow-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <nav className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              <a href="/dashboard" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600">Dashboard</a>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <a href="/dashboard/scholarships" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600">Scholarships</a>
            </nav>
            <h2 className="text-[10px] font-semibold text-slate-500">Scholarship Details</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <>
              <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} variant="hero" />
              <TrackButton scholarshipId={scholarship.id} userId={user.id} initialStatus={(tracked as any)?.status ?? null} variant="hero" />
              <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-brand-600 transition-all hover:shadow-sm active:scale-95">
                <Share2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </FadeIn>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Header - NO CARD */}
          <FadeIn delay={0.1} direction="up">
            <div className="pb-8 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {countryFlagUrl(scholarship.country) && (
                  <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                    className="w-8 h-5.5 object-cover rounded shadow-xs border border-slate-100" />
                )}
                <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg">
                  {scholarship.funding_type} Funding
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg flex items-center gap-1.5">
                  <Trophy className="w-2.5 h-2.5 text-brand-500" /> Verified
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
                {scholarship.name}
              </h1>

              <div className="flex items-center gap-3 text-slate-500 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Offered by</p>
                  <p className="text-base font-semibold text-slate-800 leading-tight">{scholarship.provider}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: MapPin, label: "Location", value: scholarship.country },
                  { icon: GraduationCap, label: "Degree", value: scholarship.degree_levels?.[0] === "Any" ? "All Levels" : scholarship.degree_levels?.[0] || "Any" },
                  { icon: Target, label: "Field", value: scholarship.fields_of_study?.[0] === "Any" ? "Open" : scholarship.fields_of_study?.[0] || "Any" },
                  { icon: Calendar, label: "Deadline", value: scholarship.application_deadline ? new Date(scholarship.application_deadline).toLocaleDateString() : "TBA" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <item.icon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Match & Eligibility Row */}
          <FadeIn delay={0.2} direction="up" className="grid md:grid-cols-2 gap-6">
            <MatchAnalysis score={calculatedScore} reasons={matchReasons} />
            <EligibilityComparison items={eligibilityItems} />
          </FadeIn>

          {/* About & Content - NO MAIN CARD */}
          <FadeIn delay={0.3} direction="up" className="space-y-10">
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-3">
                <span className="w-1 h-6 bg-brand-500 rounded-full" />
                About this Scholarship
              </h3>
              <div className="max-w-2xl">
                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                  {scholarship.description}
                </div>
              </div>
            </section>

            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">Eligible Fields of Study</h3>
              <div className="flex flex-wrap gap-2">
                {scholarship.fields_of_study?.map((f: string) => (
                  <span key={f} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-xs hover:border-brand-200 transition-colors">
                    {f}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-brand-600 rounded-2xl p-8 sm:p-10 text-white shadow-xl shadow-brand-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Ready to apply?</h3>
                <p className="text-brand-100 mb-6 max-w-md font-normal text-sm leading-relaxed">
                  Review all documentation requirements on the official portal before starting.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-all active:scale-95 shadow-lg shadow-brand-900/10 text-sm">
                    Visit Official Portal <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500 rounded-full opacity-20 blur-2xl group-hover:scale-110 transition-transform duration-700" />
            </section>
          </FadeIn>
        </div>

        {/* Right Column (Sidebar) */}
        <FadeIn delay={0.4} direction="left" className="lg:col-span-4 space-y-6">
          
          <DeadlineTimer deadline={scholarship.application_deadline} />

          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Award Financials</p>
            </div>
            
            <div className="space-y-4">
              <div className="text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-brand-600">{scholarship.funding_amount}</p>
              </div>
              
              <ul className="space-y-3">
                {[
                  { label: "Funding Type", value: scholarship.funding_type },
                  { label: "Renewable", value: scholarship.renewable ? "Yes" : "No" },
                  { label: "Est. Apply Time", value: scholarship.effort_minutes ? `${scholarship.effort_minutes}m` : "TBA" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 -mx-1 rounded-md">
                    <span className="text-[11px] font-semibold text-slate-400">{item.label}</span>
                    <span className="text-[11px] font-bold text-slate-700">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SimilarScholarships scholarships={similar} />

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-900 mb-0.5">Accuracy</p>
              <p className="text-[10px] text-amber-800/70 font-medium leading-tight">
                Verified on {scholarship.verified_at ? new Date(scholarship.verified_at).toLocaleDateString() : 'recently'}.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
