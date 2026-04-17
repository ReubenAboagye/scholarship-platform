import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DestinationsContent from "@/components/destinations/DestinationsContent";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Destinations | ScholarBridge AI",
  description: "Explore top study destinations including UK, USA, Germany, and Canada. Find curated scholarships and university opportunities.",
};

export default async function DestinationsPage() {
  const supabase = await createClient();
  
  const { data: countries } = await supabase
    .from("countries")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <DestinationsContent countries={countries || []} />
      <Footer />
    </div>
  );
}
