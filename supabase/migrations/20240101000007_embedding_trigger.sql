-- ============================================================
-- 007_embedding_trigger.sql
--
-- Installs a Postgres trigger that automatically calls the
-- generate-embedding Edge Function whenever a scholarship is
-- inserted or updated with a NULL embedding.
--
-- Secrets are read from Supabase Vault at runtime.
-- Safe to commit to git — nothing sensitive is hardcoded.
--
-- Prerequisites:
--   • Vault secrets already set:
--       OPENROUTER_API_KEY   ✓
--       SERVICE_ROLE_KEY     ✓
--   • generate-embedding Edge Function deployed ✓
--   • Run AFTER 005_add_slugs.sql and 006_auto_slug_trigger.sql
-- ============================================================

-- ── Trigger function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
DECLARE
  svc_key TEXT;
BEGIN
  -- Skip if embedding already exists
  IF NEW.embedding IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Read service role key from Vault at runtime
  SELECT decrypted_secret
    INTO svc_key
    FROM vault.decrypted_secrets
   WHERE name = 'SERVICE_ROLE_KEY'
   LIMIT 1;

  IF svc_key IS NULL THEN
    RAISE WARNING 'generate-embedding: SERVICE_ROLE_KEY not found in Vault';
    RETURN NEW;
  END IF;

  -- Fire-and-forget HTTP POST to the Edge Function via pg_net
  PERFORM net.http_post(
    url     := 'https://{PROJECT_REF}.supabase.co/functions/v1/generate-embedding',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body    := jsonb_build_object('scholarship_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Attach trigger ──────────────────────────────────────────
-- Fires only on columns that affect the embedding content.
-- Updating a deadline or URL alone won't waste an API call.
DROP TRIGGER IF EXISTS trg_scholarship_embedding ON scholarships;
CREATE TRIGGER trg_scholarship_embedding
  AFTER INSERT OR UPDATE OF
    name, description, eligibility_criteria,
    funding_type, funding_amount, degree_levels,
    fields_of_study, country
  ON scholarships
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_embedding();
