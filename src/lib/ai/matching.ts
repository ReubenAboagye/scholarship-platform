import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';
import type { MatchResult, UserProfile, Scholarship } from '@/types';

// ─────────────────────────────────────────────────────────────
// ScholarMatch AI matching (v2 — right-sized for ~20 listings)
//
// Pipeline:
//   1. Build profile text → 768-dim embedding via OpenRouter
//   2. RPC: match_scholarships_gated
//        - Hard SQL gates (active, future deadline, degree,
//          country of study, citizenship, min GPA)
//        - Vector rank by HNSW inner product
//   3. Filter out dismissed scholarships
//   4. Three-factor score: similarity + recency + field match
//   5. Attach grounded reasons and return top-N
//
// Why not hybrid (RRF) or a reranker at this scale:
//   With ~20 scholarships the hard gate usually leaves 3–10
//   candidates. BM25 on tiny documents is noise, reranking is
//   latency with no lift. We re-introduce hybrid + rerank once
//   the catalogue crosses ~200 listings.
// ─────────────────────────────────────────────────────────────

type RichProfile = Partial<UserProfile & {
  citizenship?: string | null;
  career_goals?: string | null;
  interests?: string[] | null;
  extracurriculars?: string[] | null;
  financial_need?: boolean | null;
}>;

// ── OpenRouter client ────────────────────────────────────────

function getOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL
        || 'https://scholarbridge-ai.netlify.app',
      'X-Title': 'ScholarBridge AI',
    },
  });
}

// ── Embeddings ───────────────────────────────────────────────
// text-embedding-3-small at 768d (Matryoshka-truncated from 1536)
// is the sweet spot: strong MTEB retrieval, cheap, fast, and
// HNSW-friendly at half the RAM of 1536d.

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenRouterClient();
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text,
    // @ts-ignore — OpenRouter supports `dimensions` for Matryoshka truncation
    dimensions: 768,
  });
  const vec = response.data[0].embedding;
  return vec.length === 768 ? vec : vec.slice(0, 768);
}

// ── Profile text builder ─────────────────────────────────────
// Keep this deterministic: embedding stability depends on it.
// The order matters less than the fact that we always serialise
// the same fields in the same way.

export function buildProfileText(profile: RichProfile): string {
  const parts = [
    profile.degree_level      && `Degree level: ${profile.degree_level}`,
    profile.field_of_study    && `Field of study: ${profile.field_of_study}`,
    profile.country_of_origin && `Country of origin: ${profile.country_of_origin}`,
    profile.citizenship       && `Citizenship: ${profile.citizenship}`,
    profile.gpa               && `GPA: ${profile.gpa}`,
    profile.career_goals      && `Career goals: ${profile.career_goals}`,
    profile.interests?.length && `Interests: ${profile.interests!.join(', ')}`,
    profile.extracurriculars?.length
      && `Extracurriculars: ${profile.extracurriculars!.join(', ')}`,
    profile.financial_need != null
      && `Financial need: ${profile.financial_need ? 'yes' : 'no'}`,
    profile.bio               && `Background: ${profile.bio}`,
  ].filter(Boolean);
  return parts.join('. ')
    || 'General student seeking international scholarships';
}

// ── Helpers ──────────────────────────────────────────────────

function fieldMatches(scholarshipFields: string[] | null | undefined,
                      userField: string | null | undefined): boolean {
  if (!userField || !scholarshipFields?.length) return false;
  const u = userField.toLowerCase();
  return scholarshipFields.some(f => {
    const s = f.toLowerCase();
    // Substring either way handles "Computer Science" vs "Computing",
    // "Engineering" vs "Mechanical Engineering", etc.
    return s.includes(u) || u.includes(s) || s === 'any';
  });
}

function recencyScore(deadline: string | null): number {
  // Peak value for deadlines 2–6 weeks out. Penalise both
  // "deadline already passed" (handled by SQL gate but keep
  // defensive) and "too close to realistically apply well".
  if (!deadline) return 0.5;
  const daysLeft = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0)  return 0.0;
  if (daysLeft < 3)  return 0.1;          // too rushed
  if (daysLeft < 14) return 0.9;          // sweet spot high
  if (daysLeft < 45) return 1.0;          // sweet spot
  return Math.max(0.3, Math.exp(-daysLeft / 120));
}

// ── Scoring ──────────────────────────────────────────────────
// Three factors only — kept deliberately simple because:
//   (a) we have no interaction data yet to tune weights against
//   (b) at 20-listing scale, scoring mostly just tiebreaks
// Weights are priors; revisit once match_events has signal.

function computeFinalScore(
  similarity: number,     // raw inner-product similarity from RPC
  scholarship: any,
  profile: RichProfile,
): number {
  // Similarity from inner product on normalised vectors is roughly
  // [-1, 1]; clamp and rescale to [0, 1] to mix with other factors.
  const semScore = Math.max(0, Math.min(1, (similarity + 1) / 2));

  const recency = recencyScore(scholarship.application_deadline);

  const fieldBoost = fieldMatches(scholarship.fields_of_study,
                                  profile.field_of_study)
    ? 1.0
    : profile.field_of_study ? 0.3 : 0.6;  // unknown field → neutral

  //   0.60 semantic + 0.15 recency + 0.25 field match
  // Field match gets real weight because it's the single signal
  // most likely to be wrong from a vector alone (vectors drift
  // topical: "engineering" ≈ "agriculture" more than it should).
  return 0.60 * semScore
       + 0.15 * recency
       + 0.25 * fieldBoost;
}

// ── Grounded match reasons ───────────────────────────────────
// Only emit reasons backed by actual profile + scholarship data.
// Never fabricate — if there's nothing honest to say, say less.

function buildMatchReasons(scholarship: any, profile: RichProfile): string[] {
  const reasons: string[] = [];

  if (profile.degree_level
      && (scholarship.degree_levels?.includes(profile.degree_level)
          || scholarship.degree_levels?.includes('Any'))) {
    reasons.push(`Open to ${profile.degree_level} students`);
  }

  if (fieldMatches(scholarship.fields_of_study, profile.field_of_study)) {
    reasons.push(`Relevant to ${profile.field_of_study}`);
  }

  if (scholarship.funding_type === 'Full') reasons.push('Fully funded');
  if (scholarship.open_to_international)   reasons.push('Open to international students');
  if (scholarship.renewable)               reasons.push('Renewable award');

  if (scholarship.effort_minutes && scholarship.effort_minutes <= 90) {
    reasons.push(`Quick to apply (~${scholarship.effort_minutes} min)`);
  }

  return reasons.slice(0, 3);
}

// ── Main matching function ───────────────────────────────────
// Preserves the existing signature so api/matching/route.ts and
// the UI don't need to change.

export async function matchScholarships(
  profile: RichProfile,
  limit = 10,
  userId?: string,
): Promise<MatchResult[]> {
  const supabase    = createAdminClient();
  const profileText = buildProfileText(profile);
  const embedding   = await generateEmbedding(profileText);

  // Fetch dismissed IDs so we can exclude them after ranking.
  let dismissedIds: string[] = [];
  if (userId) {
    const { data } = await supabase
      .from('dismissed_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId);
    dismissedIds = (data ?? []).map((d: any) => d.scholarship_id);
  }

  // Oversample 3x so the post-dismissed pool still hits `limit`.
  // At 20 scholarships this caps at 20 anyway.
  const fetchCount = Math.min(limit * 3, 30);

  const { data, error } = await supabase.rpc('match_scholarships_gated', {
    query_embedding:  embedding,
    user_degree:      profile.degree_level      ?? null,
    user_country:     null,   // country filter is a UI concern; keep gate open
    user_citizenship: profile.citizenship       ?? null,
    user_gpa:         profile.gpa               ?? null,
    match_count:      fetchCount,
  });

  if (error) {
    console.error('match_scholarships_gated RPC error:', error);
    return [];
  }

  const rows = (data as any[]) ?? [];

  const scored = rows
    .filter(item => !dismissedIds.includes(item.id))
    .map(item => ({
      item,
      finalScore: computeFinalScore(item.similarity ?? 0, item, profile),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored.map(({ item, finalScore }) => ({
    scholarship:   item as Scholarship,
    // Cap at 99 so we never show "100% match" — no matching system
    // is that certain, and over-confidence erodes trust fast.
    match_score:   Math.min(99, Math.round(finalScore * 100)),
    match_reasons: buildMatchReasons(item, profile),
  }));
}

// ── AI explanation (grounded, 2 sentences) ───────────────────

export async function generateMatchExplanation(
  scholarships: Scholarship[],
  profile: RichProfile,
): Promise<string> {
  const profileText = buildProfileText(profile);
  const list = scholarships
    .slice(0, 5)
    .map(s => `- ${s.name} (${s.country}, ${s.funding_type} funding)`)
    .join('\n');

  const client = getOpenRouterClient();
  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL!,
    messages: [{
      role: 'user',
      content:
`You are a scholarship advisor. Be specific and concise — 2 sentences maximum.
Do not mention any scholarships that are not in the list.

Student profile: ${profileText}

Top matched scholarships:
${list}

Explain in 2 sentences why these scholarships match this student.
Reference their field of study and degree level specifically.`,
    }],
    max_tokens:  150,
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
