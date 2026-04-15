import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) redirect("/auth/login");

  // If profile already complete, skip wizard
  const { data: profile } = await supabase
    .from("profiles")
    .select("field_of_study, degree_level, country_of_origin, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  return <OnboardingWizard />;
}
