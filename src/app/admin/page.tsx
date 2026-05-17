import { getAdminOverviewBundle } from "@/lib/admin/analytics";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import OverviewClient from "./OverviewClient";
import { type ActivityEvent } from "@/components/admin/SystemActivityFeed";

// Server component: load the analytics bundle + supporting
// lists in parallel, then hand everything to the client component
// that handles motion/animation.

export default async function AdminPage() {
  await requireAdminPageAccess();
  const supabase = createAdminClient();

  const [
    bundle,
    recentScholarships,
    recentUsers,
    auditRows,
  ] = await Promise.all([
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
    // Audit log is super-admin only; degrade gracefully on failure.
    (async () => {
      try {
        const { data } = await supabase
          .from("admin_role_audit_log")
          .select("actor_email, target_email, old_role, new_role, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        return data ?? [];
      } catch {
        return [];
      }
    })(),
  ]);

  // Build a unified activity feed from multiple sources.
  const feedEvents: ActivityEvent[] = [
    ...recentUsers.map(u => ({
      id: `signup-${u.id}`,
      kind: "signup" as const,
      title: u.full_name || u.email,
      subtitle: u.email,
      created_at: u.created_at,
      href: `/admin/users?q=${encodeURIComponent(u.email)}`,
    })),
    ...recentScholarships.map(s => ({
      id: `scholarship-${s.id}`,
      kind: "scholarship" as const,
      title: s.name,
      subtitle: `${s.country} \u00b7 ${s.funding_type}`,
      created_at: s.created_at,
      href: `/admin/scholarships?q=${encodeURIComponent(s.name)}`,
    })),
    ...(auditRows ?? []).map((a: any) => ({
      id: `audit-${a.created_at}-${a.target_email}`,
      kind: "role_change" as const,
      title: `${a.actor_email ?? "System"} \u2192 ${a.target_email ?? "Unknown"}`,
      subtitle: `${a.old_role} \u2192 ${a.new_role}`,
      created_at: a.created_at,
      href: "/admin/audit",
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <OverviewClient
      bundle={bundle}
      recentScholarships={recentScholarships}
      recentUsers={recentUsers}
      feedEvents={feedEvents}
    />
  );
}
