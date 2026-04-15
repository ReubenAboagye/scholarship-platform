# Auto-Embedding Setup Guide
# ============================================================
# Run these steps IN ORDER.
# Vault secrets are already set — skip Step 1.
# ============================================================

# ── STEP 1: Vault secrets ✓ ALREADY DONE ───────────────────
# OPENROUTER_API_KEY        → set ✓
# SUPABASE_SERVICE_ROLE_KEY → set ✓

# ── STEP 2: Deploy the Edge Function ────────────────────────
# From your project root (D:\web\scholarship-platform):

npx supabase login
npx supabase link --project-ref <YOUR-PROJECT-REF>
npx supabase functions deploy generate-embedding --no-verify-jwt

# ── STEP 3: Run migrations in Supabase SQL Editor ───────────
# Paste and run each file in this exact order:
#
#   1. supabase/migrations/005_add_slugs.sql
#   2. supabase/migrations/006_auto_slug_trigger.sql
#   3. supabase/migrations/007_embedding_trigger.sql
#
# Before running 007, replace ONE placeholder:
#   <YOUR-PROJECT-REF>  →  your Supabase Reference ID
#   Found in: Dashboard → Project Settings → General → Reference ID
#   Example: https://abcdefghijkl.supabase.co/functions/v1/generate-embedding

# ── STEP 4: Backfill existing scholarships ──────────────────
# The trigger only fires on new inserts going forward.
# Run the manual script once to embed the 20 existing rows:

pnpm tsx scripts/generate-embeddings.ts

# ── STEP 5: Test the trigger ────────────────────────────────
# Add a scholarship via the admin dashboard.
# Wait ~5 seconds, then check Supabase Table Editor:
# The embedding column on that row should be populated. ✓

# ── WHAT HAPPENS ON EVERY NEW SCHOLARSHIP ───────────────────
#
# Admin inserts scholarship
#        │
#        ├─ trg_scholarship_slug      → slug auto-generated     ✓
#        │
#        └─ trg_scholarship_embedding → pg_net HTTP POST
#                   │
#                   ▼
#          Edge Function: generate-embedding
#                   │
#                   ├─ reads SUPABASE_SERVICE_ROLE_KEY from Vault
#                   ├─ fetches scholarship row
#                   ├─ builds rich text representation
#                   ├─ calls OpenRouter → text-embedding-3-small
#                   └─ writes 1536-dim vector to scholarships.embedding
#
# Scholarship is now fully searchable by the RAG engine. ✓
