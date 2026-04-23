import { getAdminOverviewBundle } from "@/lib/admin/analytics";
import { createAdminClient } from "@/lib/supabase/server";
import OverviewClient from "./OverviewClient";

// Server component: load the analytics bundle + two supporting
// lists in parallel, then hand everything to the client component
// that handles motion/animation.

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [bundle, recentScholarships, recentUsers] = await Promise.all([
    getAdminOverviewBundle(),
    supabase
      .from("scholarships")
      .select("id, name, country, funding_type, application_deadline, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(r => r.data ?? []),
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at, country_of_origin")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(r => r.data ?? []),
  ]);

  return (
    <OverviewClient
      bundle={bundle}
      recentScholarships={recentScholarships}
      recentUsers={recentUsers}
    />
  );
}
