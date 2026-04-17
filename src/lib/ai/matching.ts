import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';
import type { MatchResult, UserProfile, Scholarship } from '@/types';

// ── OpenRouter client ─────────────────────────────────────────

function getOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://scholarbridge-ai.netlify.app',
      'X-Title': 'ScholarBridge AI',
    },
  });
}

// ── Embeddings: 768-dim Matryoshka truncation ─────────────────
// text-embedding-3-small natively outputs 1536d; passing dimensions=768
// uses Matryoshka representation — same quality, half the storage/compute.

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenRouterClient();
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text,
    dimensions: 768,
  });
  return response.data[0].embedding;
}

// ── Profile text builder ──────────────────────────────────────
// Used both for embedding and for the LLM explanation prompt.
// Order matters: most discriminating fields first.

export function buildProfileText(profile: Partial<UserProfile & {
  citizenship?: string | null;
  career_goals?: string | null;
  interests?: string[] | null;
  extracurriculars?: string[] | null;
  financial_need?: boolean | null;
}>): string {
  const parts = [
    profile.degree_level    && `Degree level: ${profile.degree_level}`,
    profile.field_of_study  && `Field of study: ${profile.field_of_study}`,
    profile.country_of_origin && `Country of origin: ${profile.country_of_origin}`,
    profile.citizenship     && `Citizenship: ${profile.citizenship}`,
    profile.gpa             && `GPA: ${profile.gpa}`,
    profile.career_goals    && `Career goals: ${profile.career_goals}`,
    profile.interests?.length && `Interests: ${profile.interests.join(', ')}`,
    profile.extracurriculars?.length && `Extracurriculars: ${profile.extracurriculars.join(', ')}`,
    profile.financial_need  !== null && profile.financial_need !== undefined
      && `Financial need: ${profile.financial_need ? 'yes' : 'no'}`,
    profile.bio             && `Background: ${profile.bio}`,
  ].filter(Boolean);
  return parts.join('. ') || 'General student seeking international scholarships';
}

// ── Hard-gate filtering helpers ───────────────────────────────
// These run in SQL before any vector work.
// NULL on a scholarship field = "no restriction" (include everyone).

function buildDegreeFilter(degree: string | null | undefined): string {
  if (!degree) return '';
  // Match exact degree OR 'Any' in the degree_levels array
  return degree;
}

// ── Weighted scoring ──────────────────────────────────────────
// Applied after vector similarity is computed.
// Keeps eligibility (boolean) separate from ranking (continuous).

function computeWeightedScore(
  vectorSim: number,
  scholarship: any,
  profile: Partial<UserProfile & { financial_need?: boolean | null }>
): number {
  const now = Date.now();
  const deadline = scholarship.application_deadline
    ? new Date(scholarship.application_deadline).getTime()
    : null;

  const daysLeft = deadline ? (deadline - now) / 86_400_000 : 90;

  // Recency: peaks around 7–14 days left; penalise <3 days (too late to apply well)
  const recencyScore = daysLeft < 3
    ? 0.1
    : Math.min(1, Math.exp(-daysLeft / 45));

  // Funding quality
  const fundingScore: Record<string, number> = {
    Full: 1.0, Partial: 0.75, 'Tuition Only': 0.5, 'Living Allowance': 0.35,
  };
  const funding = fundingScore[scholarship.funding_type as string] ?? 0.5;

  // Field of study exact match (bonus on top of semantic similarity)
  const fieldBonus = profile.field_of_study &&
    scholarship.fields_of_study?.some((f: string) =>
      f.toLowerCase().includes(profile.field_of_study!.toLowerCase()) ||
      profile.field_of_study!.toLowerCase().includes(f.toLowerCase())
    ) ? 0.15 : 0;

  // Weighted final score
  return Math.min(1,
    0.55 * vectorSim +
    0.15 * recencyScore +
    0.15 * funding +
    0.15 * (fieldBonus > 0 ? 1 : vectorSim) // amplify when field matches
  );
}

// ── Match reasons (grounded — only cite actual fields) ────────

function buildMatchReasons(scholarship: any, profile: Partial<UserProfile & {
  citizenship?: string | null;
  financial_need?: boolean | null;
}>): string[] {
  const reasons: string[] = [];

  if (profile.degree_level && scholarship.degree_levels?.includes(profile.degree_level))
    reasons.push(`Open to ${profile.degree_level} students`);

  if (profile.field_of_study && scholarship.fields_of_study?.some((f: string) =>
    f.toLowerCase().includes(profile.field_of_study!.toLowerCase()) ||
    profile.field_of_study!.toLowerCase().includes(f.toLowerCase())
  )) reasons.push(`Relevant to ${profile.field_of_study}`);

  if (scholarship.funding_type === 'Full')
    reasons.push('Fully funded');

  if (scholarship.open_to_international)
    reasons.push('Open to international students');

  if (scholarship.renewable)
    reasons.push('Renewable award');

  if (scholarship.effort_minutes && scholarship.effort_minutes <= 60)
    reasons.push('Quick application (~' + scholarship.effort_minutes + ' min)');

  return reasons.slice(0, 3);
}

// ── Main matching function ────────────────────────────────────
// 1. Build profile text + embed (768d)
// 2. Hard SQL gate: exclude expired, wrong degree, dismissed
// 3. Vector similarity via HNSW index
// 4. Weighted scoring
// 5. Return top-N with reasons

export async function matchScholarships(
  profile: Partial<UserProfile & {
    citizenship?: string | null;
    career_goals?: string | null;
    interests?: string[] | null;
    extracurriculars?: string[] | null;
    financial_need?: boolean | null;
  }>,
  limit = 10,
  userId?: string
): Promise<MatchResult[]> {
  const supabase = createAdminClient();
  const profileText = buildProfileText(profile);
  const embedding = await generateEmbedding(profileText);

  // Get dismissed IDs to exclude (if user is logged in)
  let dismissedIds: string[] = [];
  if (userId) {
    const { data: dismissed } = await supabase
      .from('dismissed_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId);
    dismissedIds = (dismissed ?? []).map((d: any) => d.scholarship_id);
  }

  // Call RPC — hard gates (deadline, is_active) are inside the SQL function
  const { data, error } = await supabase.rpc('match_scholarships', {
    query_embedding: embedding,
    match_threshold: 0.25,   // lower threshold, we re-score and filter below
    match_count: Math.min(limit * 4, 40), // oversample, then rescore
  });

  if (error) {
    console.error('Matching RPC error:', error);
    return [];
  }

  const candidates = (data as any[])
    // Exclude dismissed
    .filter((item) => !dismissedIds.includes(item.id))
    // Exclude wrong degree level
    .filter((item) => {
      if (!profile.degree_level) return true;
      return item.degree_levels?.includes(profile.degree_level) ||
             item.degree_levels?.includes('Any');
    })
    // Exclude if citizenship_required is set and doesn't match
    .filter((item) => {
      if (!item.citizenship_required || item.citizenship_required.length === 0) return true;
      if (!profile.citizenship) return true; // unknown — include generously
      return item.citizenship_required.some((c: string) =>
        c.toLowerCase() === 'any' ||
        profile.citizenship!.toLowerCase().includes(c.toLowerCase())
      );
    });

  // Re-score with weighted formula, sort, take top-N
  const scored = candidates
    .map((item) => ({
      item,
      finalScore: computeWeightedScore(item.similarity, item, profile),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored.map(({ item, finalScore }) => ({
    scholarship: item as Scholarship,
    match_score: Math.min(99, Math.round(finalScore * 100)),
    match_reasons: buildMatchReasons(item, profile),
  }));
}

// ── AI explanation via OpenRouter chat ────────────────────────

export async function generateMatchExplanation(
  scholarships: Scholarship[],
  profile: Partial<UserProfile & {
    citizenship?: string | null;
    career_goals?: string | null;
  }>
): Promise<string> {
  const profileText = buildProfileText(profile);
  const list = scholarships
    .slice(0, 5)
    .map((s) => `- ${s.name} (${s.country}, ${s.funding_type} funding)`)
    .join('\n');

  const client = getOpenRouterClient();
  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL!,
    messages: [{
      role: 'user',
      content: `You are a scholarship advisor. Be specific and concise — 2 sentences max.

Student profile: ${profileText}

Top matched scholarships:
${list}

Explain in 2 sentences why these scholarships match this student's profile. Reference their actual field and degree level.`,
    }],
    max_tokens: 150,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
