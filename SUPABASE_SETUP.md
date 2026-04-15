# Supabase Setup Guide
## ScholarBridge AI Platform

---

## Step 1 — Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **New project**
3. Fill in:
   - **Name:** `ScholarBridge AI` (or similar)
   - **Database password:** generate a strong one and save it
   - **Region:** choose closest to Ghana (Europe West is fine — Frankfurt)
4. Wait ~2 minutes for the project to provision

---

## Step 2 — Get your API Keys

In your Supabase dashboard go to:
**Settings → API**

Copy these three values into your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL     → "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY → "anon / public" key
SUPABASE_SERVICE_ROLE_KEY     → "service_role" key (keep secret)
```

---

## Step 3 — Configure Auth

Go to **Authentication → URL Configuration**

Set:
- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** add `http://localhost:3000/auth/callback` (or your production callback)

---

## Step 4 — Run Migrations (SQL Editor)

Go to **SQL Editor** in the Supabase dashboard.

Run each file **in order** — paste the contents and click **Run**:

1. `supabase/migrations/001_initial_schema.sql`
   - Creates all tables, indexes, RLS policies, auth trigger

2. `supabase/migrations/002_match_function.sql`
   - Creates the AI vector similarity search function

3. `supabase/migrations/003_seed_scholarships.sql`
   - Inserts all 20 curated scholarships

---

## Step 5 — Make yourself admin

After you sign up on the platform, run this in the SQL Editor
(replace with your actual email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## Step 6 — Generate AI Embeddings

After seeding scholarships, run this once from your project root:

```bash
pnpm tsx scripts/generate-embeddings.ts
```

This calls OpenAI to generate vector embeddings for all 20 scholarships
and stores them in Supabase. Required for AI matching to work.

Cost: ~$0.001 (less than 1 cent for 20 scholarships).

---

## Done ✅

Your Supabase backend is fully configured.

Run `pnpm dev` and test the full platform locally before deploying.
