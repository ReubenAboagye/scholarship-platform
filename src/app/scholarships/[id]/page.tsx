import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import { ArrowLeft, ExternalLink, CheckCircle, Calendar, DollarSign, MapPin, GraduationCap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SaveButton from "@/components/scholarship/SaveButton";

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: scholarship } = await supabase.from("scholarships").select("*").eq("id", id).single();
  if (!scholarship) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: saved } = user
    ? await supabase.from("saved_scholarships").select("id").eq("user_id", user.id).eq("scholarship_id", id).single()
    : { data: null };

  const infoCards = [
    { icon: MapPin,        label: "Country",      value: `${countryFlag(scholarship.country)} ${scholarship.country}` },
    { icon: DollarSign,    label: "Funding",       value: scholarship.funding_type },
    { icon: GraduationCap, label: "Degree Levels", value: scholarship.degree_levels?.join(", ") || "Any" },
    { icon: Calendar,      label: "Deadline",      value: formatDeadline(scholarship.application_deadline) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link href="/scholarships" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to scholarships
        </Link>

        <div className="border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">{countryFlag(scholarship.country)}</span>
                <span className={`text-xs px-2 py-0.5 font-semibold ${fundingBadgeColor(scholarship.funding_type)}`}>
                  {scholarship.funding_type} Funding
                </span>
              </div>
              <h1 className="font-black text-2xl text-slate-900 mb-1 leading-tight">{scholarship.name}</h1>
              <p className="text-slate-500 text-sm">{scholarship.provider}</p>
            </div>
            {user && <SaveButton scholarshipId={scholarship.id} userId={user.id} initialSaved={!!saved} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">About this scholarship</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{scholarship.description}</p>
            </div>
            <div className="border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">Eligibility Criteria</h2>
              <ul className="space-y-2">
                {scholarship.eligibility_criteria?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            {scholarship.fields_of_study?.length > 0 && scholarship.fields_of_study[0] !== "Any" && (
              <div className="border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">Fields of Study</h2>
                <div className="flex flex-wrap gap-2">
                  {scholarship.fields_of_study.map((f: string) => (
                    <span key={f} className="text-xs px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-700 font-medium">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="border border-slate-200 p-5 space-y-4">
              {infoCards.map((card) => (
                <div key={card.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{card.label}</p>
                    <p className="text-sm font-semibold text-slate-900">{card.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Funding Amount</p>
                <p className="text-sm font-semibold text-emerald-700">{scholarship.funding_amount}</p>
              </div>
            </div>

            <a href={scholarship.application_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors text-sm">
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
            {!user && (
              <Link href="/auth/signup"
                className="flex items-center justify-center w-full py-3 border border-slate-200 hover:border-slate-400 text-slate-700 font-medium transition-colors text-sm">
                Save & Track This Scholarship
              </Link>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
