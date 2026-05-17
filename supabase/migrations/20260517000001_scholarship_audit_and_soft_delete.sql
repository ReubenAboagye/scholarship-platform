-- ============================================================
-- 021_scholarship_audit_and_soft_delete.sql
-- Adds audit logging for scholarship mutations and soft-delete
-- support so destructive actions can be recovered.
-- ============================================================

-- ── 1. Soft-delete columns on scholarships ────────────────────
ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scholarships_deleted_at
  ON public.scholarships(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 2. Scholarship audit log ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_scholarship_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scholarship_id  UUID REFERENCES public.scholarships(id) ON DELETE SET NULL,
  action          TEXT NOT NULL CHECK (action IN ('create', 'update', 'soft_delete', 'hard_delete', 'bulk_soft_delete', 'bulk_activate', 'bulk_deactivate')),
  old_snapshot    JSONB,
  new_snapshot    JSONB,
  reason          TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_scholarship_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read the scholarship audit log.
-- No INSERT policy for authenticated/anon — writes happen via
-- service-role or SECURITY DEFINER functions.
DROP POLICY IF EXISTS "scholarship_audit_select_super_admin" ON public.admin_scholarship_audit_log;
CREATE POLICY "scholarship_audit_select_super_admin" ON public.admin_scholarship_audit_log
  FOR SELECT USING (private.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_scholarship_audit_scholarship_created
  ON public.admin_scholarship_audit_log(scholarship_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scholarship_audit_actor_created
  ON public.admin_scholarship_audit_log(actor_user_id, created_at DESC);

-- ── 3. Helper: log a scholarship audit row ──────────────────
CREATE OR REPLACE FUNCTION private.log_scholarship_audit(
  p_actor_user_id UUID,
  p_scholarship_id UUID,
  p_action TEXT,
  p_old_snapshot JSONB,
  p_new_snapshot JSONB,
  p_reason TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_scholarship_audit_log (
    actor_user_id, scholarship_id, action,
    old_snapshot, new_snapshot, reason,
    ip_address, user_agent
  ) VALUES (
    p_actor_user_id, p_scholarship_id, p_action,
    p_old_snapshot, p_new_snapshot, p_reason,
    p_ip_address, p_user_agent
  );
END;
$$;

-- ── 4. Update scholarships policies to exclude soft-deleted ─
-- The public read policy already filters is_active = TRUE;
-- we also need to make sure soft-deleted rows are not visible.
DROP POLICY IF EXISTS "scholarships_public_read" ON public.scholarships;
CREATE POLICY "scholarships_public_read" ON public.scholarships
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "scholarships_admin_all" ON public.scholarships;
CREATE POLICY "scholarships_admin_all" ON public.scholarships FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
