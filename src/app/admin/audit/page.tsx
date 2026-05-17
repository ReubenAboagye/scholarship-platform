import { createClient } from "@/lib/supabase/server";
import { requireSuperAdminPageAccess } from "@/lib/auth/admin";
import AuditLogClient, { type AuditRow } from "./AuditLogClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireSuperAdminPageAccess();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_role_audit_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Audit log load failed:", error);
  }

  const rows: AuditRow[] = (data ?? []) as AuditRow[];

  return <AuditLogClient rows={rows} />;
}
