import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';
import type { MatchResult, UserProfile, Scholarship } from '@/types';

type RichProfile = Partial<UserProfile & {
  citizenship?: string | null;
  career_goals?: string | null;
  interests?: string[] | null;
  extracurriculars?: string[] | null;
  financial_need?: boolean | null;
}>;

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

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenRouterClient();
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text,
    // @ts-ignore — OpenRouter supports dimensions for Matryoshka truncation
    dimensions: 768,
  });
  const embedding = response.data[0].embedding;
  // Fallback: truncate manually if provider returned 1536d
  return embedding.length === 768 ? embedding : embedding.slice(0, 768);
}

// ── Profile text builder ──────────────────────────────────────

export function buildProfileText(profile: RichProfile): string {
  const parts = [
    profile.degree_level      && `Degree level: ${profile.degree_level}`,
    profile.field_of_study    && `Field of study: ${profile.field_of_study}`,
    profile.country_of_origin && `Country of origin: ${profile.country_of_origin}`,
    profile.citizenship       && `Citizenship: ${profile.citizenship}`,
    profile.gpa               && `GPA: ${profile.gpa}`,
    profile.career_goals      && `Career goals: ${profile.career_goals}`,
    profile.interests?.length  && `Interests: ${profile.interests!.join(', ')}`,
    profile.extracurriculars?.length && `Extracurriculars: ${profile.extracurriculars!.join(', ')}`,
    profile.financial_need != null && `Financial need: ${profile.financial_need ? 'yes' : 'no'}`,
    profile.bio               && `Background: ${profile.bio}`,
  ].filter(Boolean);
  return parts.join('. ') || 'General student seeking international scholarships';
}

// ── Multi-factor weighted scoring ────────────────────────────
// rrfScore: normalised RRF rank fusion score from hybrid retrieval [0–1 approx]
// Other factors are orthogonal quality signals layered on top.

function computeFinalScore(rrfScore: number, scholarship: any, profile: RichProfile): number {
  const now      = Date.now();
  const deadline = scholarship.application_deadline
    ? new Date(scholarship.application_deadline).getTime()
    : null;
  const daysLeft = deadline ? (deadline - now) / 86_400_000 : 90;

  // Recency: peaks 7–30 days out; penalise <3 days (too rushed) and very far out
  const recency = daysLeft < 3
    ? 0.1
    : Math.min(1, Math.exp(-daysLeft / 45));

  // Funding quality
  const fundingMap: Record<string, number> = {
    Full: 1.0, Partial: 0.75, 'Tuition Only': 0.5, 'Living Allowance': 0.35,
  };
  const funding = fundingMap[scholarship.funding_type] ?? 0.5;

  // Field match bonus: exact or substring match on fields_of_study
  const fieldMatch = profile.field_of_study
    ? (scholarship.fields_of_study ?? []).some((f: string) =>
        f.toLowerCase().includes(profile.field_of_study!.toLowerCase()) ||
        profile.field_of_study!.toLowerCase().includes(f.toLowerCase())
      ) ? 1.0 : 0.0
    : 0.5; // unknown field → neutral

  // Quality signal: verified recently + renewable
  const quality = (scholarship.verified_at ? 0.6 : 0.3) +
                  (scholarship.renewable    ? 0.2 : 0.0) +
                  (scholarship.open_to_international ? 0.2 : 0.0);

  // Weighted combination
  return Math.min(1,
    0.50 * rrfScore  +
    0.18 * recency   +
    0.12 * funding   +
    0.12 * fieldMatch +
    0.08 * quality
  );
}

// ── Grounded match reasons ────────────────────────────────────

function buildMatchReasons(scholarship: any, profile: RichProfile): string[] {
  const reasons: string[] = [];

  if (profile.degree_level && scholarship.degree_levels?.includes(profile.degree_level))
    reasons.push(`Open to ${profile.degree_level} students`);

  if (profile.field_of_study && (scholarship.fields_of_study ?? []).some((f: string) =>
    f.toLowerCase().includes(profile.field_of_study!.toLowerCase()) ||
    profile.field_of_study!.toLowerCase().includes(f.toLowerCase())
  )) reasons.push(`Relevant to ${profile.field_of_study}`);

  if (scholarship.funding_type === 'Full')  reasons.push('Fully funded');
  if (scholarship.open_to_international)    reasons.push('Open to international students');
  if (scholarship.renewable)                reasons.push('Renewable award');
  if (scholarship.effort_minutes && scholarship.effort_minutes <= 60)
    reasons.push(`Quick to apply (~${scholarship.effort_minutes} min)`);

  return reasons.slice(0, 3);
}

// ── Main matching function ────────────────────────────────────
// Pipeline:
//   1. Build profile text + embed (768d)
//   2. hybrid_match_scholarships RPC:
//      - Hard SQL gates (deadline, is_active, degree, citizenship)
//      - BM25 keyword ranking (FTS tsvector)
//      - Vector ranking (HNSW inner product)
//      - RRF fusion
//   3. Client-side: exclude dismissed, extra citizenship filter
//   4. Multi-factor final scoring
//   5. Return top-N with reasons

export async function matchScholarships(
  profile: RichProfile,
  limit = 10,
  userId?: string
): Promise<MatchResult[]> {
  const supabase     = createAdminClient();
  const profileText  = buildProfileText(profile);
  const embedding    = await generateEmbedding(profileText);

  // Fetch dismissed IDs to exclude
  let dismissedIds: string[] = [];
  if (userId) {
    const { data } = await supabase
      .from('dismissed_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId);
    dismissedIds = (data ?? []).map((d: any) => d.scholarship_id);
  }

  // Oversample so we have enough after client-side filtering
  const fetchCount = Math.min(limit * 5, 60);

  const { data, error } = await supabase.rpc('hybrid_match_scholarships', {
    query_text:       profileText,
    query_embedding:  embedding,
    user_degree:      profile.degree_level      ?? null,
    user_citizenship: profile.citizenship       ?? null,
    match_count:      fetchCount,
  });

  if (error) {
    console.error('Hybrid matching RPC error:', error);
    return [];
  }

  const maxRrf = (data as any[])[0]?.rrf_score ?? 1;

  const candidates = (data as any[])
    .filter(item => !dismissedIds.includes(item.id))
    // Additional citizenship filter (RPC handles null, we handle partial match)
    .filter(item => {
      if (!item.citizenship_required?.length) return true;
      if (!profile.citizenship) return true;
      return item.citizenship_required.some((c: string) =>
        c.toLowerCase() === 'any' ||
        profile.citizenship!.toLowerCase().includes(c.toLowerCase())
      );
    });

  const scored = candidates
    .map(item => ({
      item,
      finalScore: computeFinalScore(item.rrf_score / maxRrf, item, profile),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored.map(({ item, finalScore }) => ({
    scholarship: item as Scholarship,
    match_score: Math.min(99, Math.round(finalScore * 100)),
    match_reasons: buildMatchReasons(item, profile),
  }));
}

// ── AI explanation ────────────────────────────────────────────

export async function generateMatchExplanation(
  scholarships: Scholarship[],
  profile: RichProfile
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
      content: `You are a scholarship advisor. Be specific and concise — 2 sentences max.\n\nStudent profile: ${profileText}\n\nTop matched scholarships:\n${list}\n\nExplain in 2 sentences why these scholarships match this student. Reference their field and degree level.`,
    }],
    max_tokens: 150,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
