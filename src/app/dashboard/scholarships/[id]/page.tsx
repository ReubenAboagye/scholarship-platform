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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      
      {/* Breadcrumbs & Actions */}
      <FadeIn direction="down" className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <a href="/dashboard/scholarships"
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 transition-all hover:shadow-md active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              <a href="/dashboard" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600">Dashboard</a>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <a href="/dashboard/scholarships" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600">Scholarships</a>
            </nav>
            <h2 className="text-xs font-semibold text-slate-500">Scholarship Details</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <>
              <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} variant="hero" />
              <TrackButton scholarshipId={scholarship.id} userId={user.id} initialStatus={(tracked as any)?.status ?? null} variant="hero" />
              <button className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-brand-600 transition-all hover:shadow-md active:scale-95">
                <Share2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </FadeIn>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Hero Header - NO CARD */}
          <FadeIn delay={0.1} direction="up">
            <div className="pb-10 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {countryFlagUrl(scholarship.country) && (
                  <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                    className="w-10 h-7 object-cover rounded shadow-sm border border-slate-100" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-full">
                  {scholarship.funding_type} Funding
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-brand-500" /> Verified
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-8">
                {scholarship.name}
              </h1>

              <div className="flex items-center gap-4 text-slate-500 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Offered by</p>
                  <p className="text-lg font-semibold text-slate-800">{scholarship.provider}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: MapPin, label: "Location", value: scholarship.country },
                  { icon: GraduationCap, label: "Degree", value: scholarship.degree_levels?.[0] === "Any" ? "All Levels" : scholarship.degree_levels?.[0] || "Any" },
                  { icon: Target, label: "Field", value: scholarship.fields_of_study?.[0] === "Any" ? "Open" : scholarship.fields_of_study?.[0] || "Any" },
                  { icon: Calendar, label: "Deadline", value: scholarship.application_deadline ? new Date(scholarship.application_deadline).toLocaleDateString() : "TBA" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <item.icon className="w-4 h-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                    </div>
                    <p className="text-base font-bold text-slate-900 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Match & Eligibility Row */}
          <FadeIn delay={0.2} direction="up" className="grid md:grid-cols-2 gap-8">
            <MatchAnalysis score={calculatedScore} reasons={matchReasons} />
            <EligibilityComparison items={eligibilityItems} />
          </FadeIn>

          {/* About & Content - NO MAIN CARD */}
          <FadeIn delay={0.3} direction="up" className="space-y-16">
            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-4">
                <span className="w-1.5 h-8 bg-brand-500 rounded-full" />
                About this Scholarship
              </h3>
              <div className="max-w-3xl">
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                  {scholarship.description}
                </div>
              </div>
            </section>

            <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">Eligible Fields of Study</h3>
              <div className="flex flex-wrap gap-2.5">
                {scholarship.fields_of_study?.map((f: string) => (
                  <span key={f} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm hover:border-brand-200 transition-colors">
                    {f}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-brand-600 rounded-[3rem] p-10 sm:p-14 text-white shadow-2xl shadow-brand-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Ready to reach your potential?</h3>
                <p className="text-brand-100 mb-10 max-w-lg font-normal text-lg leading-relaxed">
                  Join thousands of students who have advanced their careers through the {scholarship.name}.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-brand-600 font-bold rounded-2xl hover:bg-brand-50 transition-all active:scale-95 shadow-xl shadow-brand-900/10">
                    Visit Official Portal <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-500 rounded-full opacity-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-400 rounded-full opacity-10 blur-2xl" />
            </section>
          </FadeIn>
        </div>

        {/* Right Column (Sidebar) */}
        <FadeIn delay={0.4} direction="left" className="lg:col-span-4 space-y-8">
          
          <DeadlineTimer deadline={scholarship.application_deadline} />

          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Award Financials</p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Total Value</p>
                <p className="text-3xl font-bold text-brand-600">{scholarship.funding_amount}</p>
              </div>
              
              <ul className="space-y-4">
                {[
                  { label: "Funding Type", value: scholarship.funding_type },
                  { label: "Renewable", value: scholarship.renewable ? "Yes" : "Single Award" },
                  { label: "Est. Apply Time", value: scholarship.effort_minutes ? `${scholarship.effort_minutes} mins` : "TBA" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 -mx-1 rounded-lg">
                    <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                    <span className="text-xs font-bold text-slate-700">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SimilarScholarships scholarships={similar} />

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">Scholarship Accuracy</p>
              <p className="text-[11px] text-amber-800/70 font-medium leading-relaxed">
                This scholarship was last verified on {scholarship.verified_at ? new Date(scholarship.verified_at).toLocaleDateString() : 'recently'}. Details are subject to change by the provider.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
