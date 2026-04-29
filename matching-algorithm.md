# Scholarship Matching Algorithm

**Project:** ScholarBridge AI  
**Audience:** founders and engineers  
**Status:** implementation-aligned documentation  

## 1. What this document is

This document explains the matching system that is actually implemented in this codebase today.

That matters because the previous draft described a larger future-state system with things like:

- `student_profiles`
- `match_results`
- taxonomy-based field matching
- weighted funding and provider reputation signals
- a `match_with_semantic` RPC

None of those are the current production path. The shipped matcher is simpler and intentionally right-sized for a small scholarship catalog.

## 2. High-level flow

The current matcher is a gated semantic ranking pipeline:

1. Read the signed-in user's profile from `profiles`
2. Build deterministic profile text from structured profile fields
3. Generate or reuse a cached 768-dimensional embedding for that profile text
4. Call a Supabase RPC that:
   - applies hard eligibility gates in SQL
   - ranks surviving scholarships by vector similarity
5. Remove scholarships the user already dismissed
6. Re-score the remaining rows in application code using three signals:
   - semantic similarity
   - application deadline recency
   - field-of-study match
7. Return top results with grounded match reasons
8. Optionally generate a short AI explanation for the top matches
9. Save the run to `match_history` and log impression events

In short: SQL handles hard constraints, vectors handle semantic retrieval, and TypeScript does the final lightweight rerank.

## 3. Why the algorithm is simple

The code is explicit about the design choice: the current catalog is about 20 scholarships, not hundreds or thousands.

Because of that, the implementation does **not** use:

- BM25 plus vector fusion
- a second-stage reranker
- collaborative filtering
- learning-to-rank
- heavy per-user cached match tables

At this size, those would add moving parts without much lift. The current system optimizes for clarity, latency, and low operational cost.

## 4. Request path

The entry point is [`src/app/api/matching/route.ts`](/d:/web/scholarship-platform/src/app/api/matching/route.ts).

The route does four important things before matching starts:

```ts
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

if (!profile.field_of_study && !profile.degree_level) {
  return NextResponse.json(
    { error: "Complete your profile before running AI matching." },
    { status: 400 }
  );
}
```

### What this means

- Matching is only available to authenticated users.
- The algorithm reads from the `profiles` table, not `student_profiles`.
- The route blocks matching only if both `field_of_study` and `degree_level` are missing.
- The API also applies a user cooldown:

```ts
const cooldown = await consumeUserCooldown(supabase, "ai_matching", 30_000);
```

That is a 30-second cooldown, not an hourly quota.

## 5. Profile data used for matching

The matcher works with the `profiles` table plus a few later-added fields.

Core fields used by the matching logic include:

- `degree_level`
- `field_of_study`
- `country_of_origin`
- `citizenship`
- `gpa`
- `career_goals`
- `interests`
- `extracurriculars`
- `financial_need`
- `bio`

The implementation builds one deterministic text block from those values in [`src/lib/ai/matching.ts`](/d:/web/scholarship-platform/src/lib/ai/matching.ts):

```ts
export function buildProfileText(profile: RichProfile): string {
  const parts = [
    profile.degree_level && `Degree level: ${profile.degree_level}`,
    profile.field_of_study && `Field of study: ${profile.field_of_study}`,
    profile.country_of_origin && `Country of origin: ${profile.country_of_origin}`,
    profile.citizenship && `Citizenship: ${profile.citizenship}`,
    profile.gpa && `GPA: ${profile.gpa}`,
    profile.career_goals && `Career goals: ${profile.career_goals}`,
    profile.interests?.length && `Interests: ${profile.interests!.join(', ')}`,
    profile.extracurriculars?.length &&
      `Extracurriculars: ${profile.extracurriculars!.join(', ')}`,
    profile.financial_need != null &&
      `Financial need: ${profile.financial_need ? 'yes' : 'no'}`,
    profile.bio && `Background: ${profile.bio}`,
  ].filter(Boolean);

  return parts.join('. ')
    || 'General student seeking international scholarships';
}
```

### Why this matters

The embedding is not generated from raw JSON. It is generated from this exact serialized text. That gives the system three useful properties:

- embedding inputs are stable
- cache keys can be derived from the exact text
- changing the serialization automatically invalidates the cache

## 6. Embedding generation

Profile embeddings are generated through OpenRouter using `openai/text-embedding-3-small`.

Current implementation details:

- model: `openai/text-embedding-3-small`
- dimensions used in the app: `768`
- vector column size in Postgres: `vector(768)`
- similarity operator in the current RPC: inner product

The embedding call in [`src/lib/ai/matching.ts`](/d:/web/scholarship-platform/src/lib/ai/matching.ts) is:

```ts
const response = await client.embeddings.create({
  model: EMBEDDING_MODEL,
  input: text,
  dimensions: EMBEDDING_DIMS,
});
```

The scholarship embeddings are generated separately by [`scripts/generate-embeddings.ts`](/d:/web/scholarship-platform/scripts/generate-embeddings.ts), which serializes scholarship content into text and writes the resulting vector back to `scholarships.embedding`.

Example scholarship embedding text:

```ts
function buildScholarshipText(s: any): string {
  return [
    `Scholarship name: ${s.name}`,
    `Provider: ${s.provider}`,
    `Country: ${s.country}`,
    `Funding type: ${s.funding_type}`,
    `Funding amount: ${s.funding_amount}`,
    `Degree levels: ${s.degree_levels?.join(", ")}`,
    `Fields of study: ${s.fields_of_study?.join(", ")}`,
    `Description: ${s.description}`,
    `Eligibility: ${s.eligibility_criteria?.join(". ")}`,
  ].join("\n");
}
```

## 7. Embedding cache

Profile embeddings are cached in `public.embedding_cache`.

The cache key is a SHA-256 hash of:

- model
- dimensions
- exact profile text

That logic looks like this:

```ts
const contentHash = sha256Hex(`${EMBEDDING_MODEL}:${EMBEDDING_DIMS}:${text}`);
```

### Cache behavior

1. Look up `embedding_cache` by `content_hash`
2. If found, parse the stored pgvector value and reuse it
3. If not found, call OpenRouter
4. Upsert the result back into `embedding_cache`

This keeps repeated matching runs cheap for unchanged profiles.

## 8. SQL hard gates plus vector retrieval

The main database-side matcher is `match_scholarships_gated`, created in [`supabase/migrations/20240419120000_simplify_matching.sql`](/d:/web/scholarship-platform/supabase/migrations/20240419120000_simplify_matching.sql).

The TypeScript caller passes:

```ts
const { data, error } = await supabase.rpc('match_scholarships_gated', {
  query_embedding: embedding,
  user_degree: profile.degree_level ?? null,
  user_country: null,
  user_citizenship: profile.citizenship ?? null,
  user_gpa: profile.gpa ?? null,
  match_count: fetchCount,
});
```

### Important input detail

`user_country` is intentionally passed as `null`.

The comment in code says:

```ts
user_country: null,   // country filter is a UI concern; keep gate open
```

So the matcher does **not** hard-filter by destination country today.

### RPC behavior

The SQL function applies these gates:

- scholarship is active
- scholarship embedding exists
- application deadline has not passed
- degree level matches, with `"Any"` treated as a wildcard
- citizenship restriction passes
- GPA threshold passes

Core query shape:

```sql
SELECT
  s.id,
  s.name,
  s.slug,
  s.provider,
  s.country,
  s.degree_levels,
  s.fields_of_study,
  s.funding_type,
  s.funding_amount,
  s.description,
  s.eligibility_criteria,
  s.application_deadline,
  s.application_url,
  s.is_active,
  s.open_to_international,
  s.renewable,
  s.min_gpa,
  s.effort_minutes,
  s.citizenship_required,
  s.verified_at,
  (s.embedding <#> query_embedding) * -1 AS similarity
FROM scholarships s
WHERE s.is_active = TRUE
  AND s.embedding IS NOT NULL
  AND (
    s.application_deadline IS NULL
    OR s.application_deadline > CURRENT_DATE
  )
ORDER BY s.embedding <#> query_embedding
LIMIT match_count;
```

The real function includes the degree, citizenship, and GPA gates too.

## 9. Vector index strategy

The vector index was upgraded in [`supabase/migrations/20240101000012_hnsw_and_events.sql`](/d:/web/scholarship-platform/supabase/migrations/20240101000012_hnsw_and_events.sql).

Current state:

- vector size: `768`
- index type: `hnsw`
- operator class: `vector_ip_ops`
- similarity metric used by RPC: inner product

The index definition is:

```sql
CREATE INDEX IF NOT EXISTS idx_scholarships_embedding_hnsw
  ON scholarships USING hnsw (embedding vector_ip_ops)
  WITH (m = 16, ef_construction = 64);
```

This is another place where the previous draft was wrong: the current implementation is not using an IVF Flat cosine index.

## 10. Application-side reranking

After the SQL RPC returns rows, the app performs a lightweight rerank in TypeScript.

This happens in [`src/lib/ai/matching.ts`](/d:/web/scholarship-platform/src/lib/ai/matching.ts).

### Step 1: dismiss filter

If a `userId` is present, the matcher first loads `dismissed_scholarships` and removes those rows from the candidate list.

### Step 2: oversampling

The RPC fetches more than the final requested count:

```ts
const fetchCount = Math.min(limit * 3, 30);
```

That gives the reranker room to recover after dismissed scholarships are removed.

### Step 3: final score

The final score uses exactly three signals:

```ts
return 0.60 * semScore
     + 0.15 * recency
     + 0.25 * fieldBoost;
```

There are no provider reputation, funding alignment, taxonomy distance, or personalization weights in the current scoring model.

## 11. The three scoring signals

### 11.1 Semantic similarity

The SQL RPC returns a raw inner-product similarity score.

The app rescales that score into `[0, 1]` before mixing it with the other signals:

```ts
const semScore = Math.max(0, Math.min(1, (similarity + 1) / 2));
```

This is the dominant signal at 60% of the final score.

### 11.2 Recency score

The second signal rewards scholarships with deadlines that are near enough to be actionable, but not so close that the user is unlikely to complete a strong application.

```ts
function recencyScore(deadline: string | null): number {
  if (!deadline) return 0.5;
  const daysLeft = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0)  return 0.0;
  if (daysLeft < 3)  return 0.1;
  if (daysLeft < 14) return 0.9;
  if (daysLeft < 45) return 1.0;
  return Math.max(0.3, Math.exp(-daysLeft / 120));
}
```

Interpretation:

- passed deadlines score `0`
- extremely close deadlines are penalized
- roughly 2 to 6 weeks out is the best window
- far-future deadlines decay but never drop below `0.3`

### 11.3 Field match

Field matching is intentionally simple string matching, not taxonomy lookup.

```ts
function fieldMatches(
  scholarshipFields: string[] | null | undefined,
  userField: string | null | undefined
): boolean {
  if (!userField || !scholarshipFields?.length) return false;
  const u = userField.toLowerCase();
  return scholarshipFields.some(f => {
    const s = f.toLowerCase();
    return s.includes(u) || u.includes(s) || s === 'any';
  });
}
```

Then the score is converted into a small boost:

```ts
const fieldBoost = fieldMatches(scholarship.fields_of_study, profile.field_of_study)
  ? 1.0
  : profile.field_of_study ? 0.3 : 0.6;
```

Interpretation:

- exact or broad substring match -> `1.0`
- profile has a field but no match -> `0.3`
- profile field is unknown -> `0.6`

This is a pragmatic heuristic. It is easy to reason about, but it will eventually hit precision limits.

## 12. Match reasons shown to the user

The algorithm returns human-readable reasons, but those reasons are grounded in real scholarship and profile data.

That logic is in `buildMatchReasons()`:

```ts
if (profile.degree_level
    && (scholarship.degree_levels?.includes(profile.degree_level)
        || scholarship.degree_levels?.includes('Any'))) {
  reasons.push(`Open to ${profile.degree_level} students`);
}

if (fieldMatches(scholarship.fields_of_study, profile.field_of_study)) {
  reasons.push(`Relevant to ${profile.field_of_study}`);
}

if (scholarship.funding_type === 'Full') reasons.push('Fully funded');
if (scholarship.open_to_international) reasons.push('Open to international students');
if (scholarship.renewable) reasons.push('Renewable award');

if (scholarship.effort_minutes && scholarship.effort_minutes <= 90) {
  reasons.push(`Quick to apply (~${scholarship.effort_minutes} min)`);
}
```

Important constraint: the function returns at most three reasons.

## 13. Score presentation

The final score returned to the UI is:

```ts
match_score: Math.min(99, Math.round(finalScore * 100))
```

Two consequences:

1. the score is shown as an integer percentage
2. the algorithm intentionally never shows `100%`

That cap is a trust decision. The code comment is correct: no real matching system should present itself as perfectly certain.

## 14. AI explanation layer

After ranking finishes, the API may generate a short explanation across the top scholarships.

This is separate from the rule-based per-result reasons.

The explanation function:

- uses an OpenRouter chat model from `OPENROUTER_MODEL`
- limits output to two sentences
- only references the returned scholarship list
- caches the explanation for 24 hours

Prompt shape:

```ts
Student profile: ${profileText}

Top matched scholarships:
${list}

Explain in 2 sentences why these scholarships match this student.
Reference their field of study and degree level specifically.
```

### Explanation cache

The cache is stored in `public.match_explanation_cache`.

The key is:

- hash of model + profile text
- hash of sorted top scholarship IDs

This means the explanation is reused only when the profile and the top result set are effectively the same.

## 15. Persistence and analytics

After a match run succeeds, the API route stores the session in `match_history`:

```ts
await supabase.from("match_history").insert({
  user_id: user.id,
  profile_snapshot: profileSnapshot,
  results: results,
  explanation: explanation,
});
```

That gives the product two useful features:

- users can revisit previous runs
- the team can inspect historical matching outputs later

The route also logs impressions through the `log_match_impressions` RPC:

```ts
void logMatchImpressions(user.id, results);
```

This is used for future analysis and eventual model tuning.

## 16. Data structures involved

Current matching-related storage:

- `profiles` -> user inputs used for matching
- `scholarships` -> scholarship metadata plus embedding
- `dismissed_scholarships` -> items the user no longer wants to see
- `match_history` -> historical matching sessions
- `match_events` -> impression and interaction telemetry
- `embedding_cache` -> cached profile embeddings
- `match_explanation_cache` -> cached LLM explanations

This is the real operational footprint today. It is much smaller than the system described in the previous draft.

## 17. Design tradeoffs

### Strengths

- simple to debug
- cheap to operate
- low latency
- deterministic hard filtering
- semantic matching still captures non-trivial profile/scholarship similarity
- reasonable instrumentation already exists

### Current limits

- field matching is substring-based and can be crude
- no funding-preference scoring
- no provider-quality weighting
- no collaborative or behavior-based reranking
- no explicit country-of-study filtering in the matcher itself
- no offline evaluation harness in this repo yet

Those are acceptable limits for a small catalog. They become a problem only when the inventory and user traffic grow.

## 18. Why Claude's original document was off

The previous document was not useless, but it mixed aspirational architecture with the current implementation.

The main mismatches were:

- wrong table names
- wrong RPC names
- wrong vector size in the live pipeline
- wrong index type and similarity setup
- scoring signals that do not exist in code
- a caching model that does not match current persistence tables

As a product or investor document, that draft reads polished. As engineering documentation for this repository, it is inaccurate.

## 19. Recommended next upgrade path

If this matcher needs to evolve, the most defensible order is:

1. improve field matching beyond substring checks
2. add explicit destination-country preference into the scoring or gating layer
3. start using `match_events` to validate scoring assumptions
4. add an offline eval set before introducing more ranking complexity
5. only then consider hybrid retrieval or learning-to-rank

That order keeps the system measurable while complexity increases.

## 20. File map

Primary files for the current matching system:

- [`src/app/api/matching/route.ts`](/d:/web/scholarship-platform/src/app/api/matching/route.ts)
- [`src/lib/ai/matching.ts`](/d:/web/scholarship-platform/src/lib/ai/matching.ts)
- [`scripts/generate-embeddings.ts`](/d:/web/scholarship-platform/scripts/generate-embeddings.ts)
- [`src/lib/tracking/match-events.ts`](/d:/web/scholarship-platform/src/lib/tracking/match-events.ts)
- [`supabase/migrations/20240419120000_simplify_matching.sql`](/d:/web/scholarship-platform/supabase/migrations/20240419120000_simplify_matching.sql)
- [`supabase/migrations/20240101000012_hnsw_and_events.sql`](/d:/web/scholarship-platform/supabase/migrations/20240101000012_hnsw_and_events.sql)
- [`supabase/migrations/20260422230000_matching_caches.sql`](/d:/web/scholarship-platform/supabase/migrations/20260422230000_matching_caches.sql)

That is the current source of truth.
