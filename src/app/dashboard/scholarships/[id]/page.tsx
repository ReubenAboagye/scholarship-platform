import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import { ArrowLeft, ExternalLink, CheckCircle, Calendar, DollarSign, MapPin, GraduationCap, Building2 } from "lucide-react";
import SaveButton from "@/components/scholarship/SaveButton";
import TrackButton from "@/components/scholarship/TrackButton";

export default async function DashboardScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

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

  const isPast = scholarship.application_deadline && new Date(scholarship.application_deadline) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <a href="/dashboard/scholarships"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </a>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} variant="hero" />
              <TrackButton scholarshipId={scholarship.id} userId={user.id} initialStatus={(tracked as any)?.status ?? null} variant="hero" />
            </>
          )}
        </div>
      </div>

      {/* Main header block */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-8 sm:px-10 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {countryFlagUrl(scholarship.country) && (
              <img src={countryFlagUrl(scholarship.country)!} alt={scholarship.country}
                className="w-10 h-6.5 object-cover rounded border border-slate-200 shadow-sm" />
            )}
            <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg">
              {scholarship.funding_type} Funding
            </span>
            {isPast && (
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                Application Closed
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
            {scholarship.name}
          </h1>
          
          <div className="flex items-center gap-2 text-slate-500 mb-8">
            <Building2 className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold">{scholarship.provider}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MapPin,        label: "Destinations", value: scholarship.country },
              { icon: DollarSign,    label: "Award Types",  value: scholarship.funding_type },
              { icon: GraduationCap, label: "Education",    value: scholarship.degree_levels?.join(", ") || "Any level" },
              { icon: Calendar,      label: "Main Deadline",value: formatDeadline(scholarship.application_deadline) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                </div>
                <p className={`text-sm font-bold truncate ${label === "Main Deadline" && isPast ? "text-rose-500" : "text-slate-900"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 flex flex-col lg:flex-row gap-12">
          {/* Main info */}
          <div className="flex-1 space-y-10">
            <section>
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                About this Scholarship
              </h2>
              <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                {scholarship.description}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-slate-900 mb-6">Eligibility & Selection</h2>
              <div className="grid gap-4">
                {scholarship.eligibility_criteria?.map((c: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="mt-0.5 w-6 h-6 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            </section>

            {scholarship.fields_of_study?.length > 0 && scholarship.fields_of_study[0] !== "Any" && (
              <section>
                <h2 className="text-lg font-black text-slate-900 mb-6">Eligible Fields of Study</h2>
                <div className="flex flex-wrap gap-2.5">
                  {scholarship.fields_of_study.map((f: string) => (
                    <span key={f} className="text-xs font-bold px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl shadow-sm hover:border-brand-300 transition-colors">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="p-6 sm:p-8 bg-brand-50 border border-brand-100 rounded-3xl">
              <h2 className="text-lg font-black text-brand-900 mb-4">Application Guidance</h2>
              <p className="text-brand-800/80 text-sm leading-relaxed mb-8">
                Applications are handled through the official provider portal. We recommend reviewing all documentation requirements — including personal statements and references — early to ensure a strong application.
              </p>
              <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all text-sm rounded-2xl shadow-lg shadow-brand-200 active:scale-95">
                Visit Official Portal <ExternalLink className="w-4 h-4" />
              </a>
            </section>
          </div>

          {/* Right sidebar quick summary */}
          <aside className="lg:w-72 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Award Info</p>
              </div>
              <div className="p-5 space-y-6 text-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Value</p>
                  <p className="text-xl font-black text-brand-600 leading-tight">{scholarship.funding_amount}</p>
                </div>
                <hr className="border-slate-100" />
                <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
                  className="block w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
                  Start Application
                </a>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Sharing</h3>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                You can save this scholarship to your profile or track your application status using the buttons in the top header.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
