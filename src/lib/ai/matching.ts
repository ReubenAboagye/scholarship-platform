import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import {
  computeStudyFieldAlignment,
  getStudyFieldName,
  resolveStudyFieldSlug,
  resolveStudyFieldSlugs,
} from '@/lib/constants/study-fields';
import type { MatchResult, MatchScoreBreakdown, UserProfile, Scholarship } from '@/types';

type RichProfile = Partial<UserProfile & {
  citizenship?: string | null;
  career_goals?: string | null;
  interests?: string[] | null;
  extracurriculars?: string[] | null;
  financial_need?: boolean | null;
  primary_field_slug?: string | null;
}>;

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMS = 768;
const EXPLANATION_TTL_MS = 24 * 60 * 60 * 1000;

type BehaviorSignals = {
  savedIds: Set<string>;
  trackedStatuses: Map<string, string>;
  eventScores: Map<string, number>;
};

const DEFAULT_BEHAVIOR_SIGNALS: BehaviorSignals = {
  savedIds: new Set(),
  trackedStatuses: new Map(),
  eventScores: new Map(),
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toPct(value: number): number {
  return Math.round(clamp01(value) * 100);
}

function getOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL
        || 'https://scholarbridgeai.netlify.app',
      'X-Title': 'ScholarBridge AI',
    },
  });
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function hashScholarshipIds(ids: string[]): string {
  return sha256Hex([...ids].sort().join('|'));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const supabase = createAdminClient();
  const contentHash = sha256Hex(`${EMBEDDING_MODEL}:${EMBEDDING_DIMS}:${text}`);

  try {
    const { data: cached } = await supabase
      .from('embedding_cache')
      .select('embedding, hit_count')
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (cached?.embedding) {
      void supabase
        .from('embedding_cache')
        .update({
          hit_count: (cached as any).hit_count != null
            ? (cached as any).hit_count + 1
            : undefined,
          last_used_at: new Date().toISOString(),
        })
        .eq('content_hash', contentHash)
        .then(() => undefined, () => undefined);

      const vec = parsePgVector(cached.embedding as unknown as string | number[]);
      if (vec.length === EMBEDDING_DIMS) return vec;
    }
  } catch (err) {
    console.warn('embedding_cache lookup failed, falling back to live call', err);
  }

  const client = getOpenRouterClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    // @ts-ignore OpenRouter supports dimensions for Matryoshka truncation.
    dimensions: EMBEDDING_DIMS,
  });

  const raw = response.data[0].embedding;
  const vec = raw.length === EMBEDDING_DIMS ? raw : raw.slice(0, EMBEDDING_DIMS);

  void supabase
    .from('embedding_cache')
    .upsert({
      content_hash: contentHash,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMS,
      embedding: vec as unknown as string,
      hit_count: 0,
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'content_hash' })
    .then(() => undefined, err => console.warn('embedding_cache upsert failed', err));

  return vec;
}

function parsePgVector(v: string | number[]): number[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string') return [];

  const trimmed = v.trim().replace(/^\[|\]$/g, '');
  if (!trimmed) return [];
  return trimmed.split(',').map(Number);
}

export function buildProfileText(profile: RichProfile): string {
  const parts = [
    profile.degree_level && `Degree level: ${profile.degree_level}`,
    profile.field_of_study && `Field of study: ${profile.field_of_study}`,
    profile.country_of_origin && `Country of origin: ${profile.country_of_origin}`,
    profile.citizenship && `Citizenship: ${profile.citizenship}`,
    profile.gpa && `GPA: ${profile.gpa}`,
    profile.career_goals && `Career goals: ${profile.career_goals}`,
    profile.interests?.length && `Interests: ${profile.interests.join(', ')}`,
    profile.extracurriculars?.length
      && `Extracurriculars: ${profile.extracurriculars.join(', ')}`,
    profile.financial_need != null
      && `Financial need: ${profile.financial_need ? 'yes' : 'no'}`,
    profile.bio && `Background: ${profile.bio}`,
  ].filter(Boolean);

  return parts.join('. ') || 'General student seeking international scholarships';
}

function getProfileFieldSlug(profile: RichProfile): string | null {
  return profile.primary_field_slug ?? resolveStudyFieldSlug(profile.field_of_study);
}

function getScholarshipFieldSlugs(
  scholarship: Pick<Scholarship, 'fields_of_study'> & { study_field_slugs?: string[] | null }
): string[] {
  if (Array.isArray(scholarship.study_field_slugs) && scholarship.study_field_slugs.length > 0) {
    return scholarship.study_field_slugs;
  }

  return resolveStudyFieldSlugs(scholarship.fields_of_study ?? []);
}

function fieldAlignmentScore(
  scholarship: Pick<Scholarship, 'fields_of_study'> & { study_field_slugs?: string[] | null },
  profile: RichProfile,
): number {
  const scholarshipFieldSlugs = getScholarshipFieldSlugs(scholarship);
  if (!scholarshipFieldSlugs.length) return 0.5;

  const profileFieldSlug = getProfileFieldSlug(profile);
  if (!profileFieldSlug) {
    return profile.field_of_study ? 0.3 : 0.6;
  }

  return computeStudyFieldAlignment(profileFieldSlug, scholarshipFieldSlugs);
}

function recencyScore(deadline: string | null): number {
  if (!deadline) return 0.5;

  const daysLeft = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0) return 0.0;
  if (daysLeft < 3) return 0.1;
  if (daysLeft < 14) return 0.9;
  if (daysLeft < 45) return 1.0;
  return Math.max(0.3, Math.exp(-daysLeft / 120));
}

function eligibilityScore(
  scholarship: Scholarship,
  profile: RichProfile,
): number {
  const scores: number[] = [];

  if (profile.degree_level) {
    const levels = scholarship.degree_levels ?? [];
    scores.push(
      levels.length === 0 || levels.includes('Any')
        ? 0.85
        : levels.includes(profile.degree_level)
          ? 1
          : 0,
    );
  }

  if (profile.citizenship) {
    const required = scholarship.citizenship_required ?? [];
    scores.push(
      required.length === 0 || required.some((c) => c.toLowerCase() === 'any')
        ? 0.85
        : required.some((c) => profile.citizenship?.toLowerCase().includes(c.toLowerCase()))
          ? 1
          : 0,
    );
  } else if (scholarship.open_to_international) {
    scores.push(0.75);
  }

  if (scholarship.min_gpa != null && profile.gpa != null) {
    scores.push(profile.gpa >= scholarship.min_gpa ? 1 : 0);
  } else if (scholarship.min_gpa == null) {
    scores.push(0.85);
  }

  if (scholarship.open_to_international) scores.push(0.9);

  return scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0.75;
}

function fundingFitScore(scholarship: Scholarship, profile: RichProfile): number {
  if (profile.financial_need === true) {
    switch (scholarship.funding_type) {
      case 'Full': return 1;
      case 'Living Allowance': return 0.9;
      case 'Tuition Only': return 0.75;
      case 'Partial': return 0.65;
      default: return 0.6;
    }
  }

  switch (scholarship.funding_type) {
    case 'Full': return 0.85;
    case 'Living Allowance': return 0.78;
    case 'Tuition Only': return 0.72;
    case 'Partial': return 0.68;
    default: return 0.65;
  }
}

function effortScore(minutes: number | null | undefined): number {
  if (!minutes) return 0.65;
  if (minutes <= 60) return 1;
  if (minutes <= 120) return 0.85;
  if (minutes <= 240) return 0.65;
  return 0.45;
}

function freshnessScore(scholarship: Scholarship): number {
  const reference = scholarship.verified_at ?? scholarship.updated_at ?? scholarship.created_at;
  if (!reference) return 0.55;

  const ageDays = (Date.now() - new Date(reference).getTime()) / 86_400_000;
  if (ageDays <= 90) return 1;
  if (ageDays <= 180) return 0.9;
  if (ageDays <= 365) return 0.75;
  return 0.55;
}

function behaviorScore(scholarshipId: string, signals: BehaviorSignals): number {
  let score = signals.eventScores.get(scholarshipId) ?? 0.5;

  if (signals.savedIds.has(scholarshipId)) score += 0.08;

  const status = signals.trackedStatuses.get(scholarshipId);
  if (status === 'Interested') score += 0.04;
  if (status === 'In Progress') score += 0.08;
  if (status === 'Submitted' || status === 'Awaiting Decision') score -= 0.04;
  if (status === 'Accepted') score -= 0.08;
  if (status === 'Rejected' || status === 'Withdrawn' || status === 'Deadline Passed') score -= 0.2;

  return clamp01(score);
}

function computeScoreBreakdown(
  similarity: number,
  scholarship: Scholarship & { study_field_slugs?: string[] | null },
  profile: RichProfile,
  signals: BehaviorSignals,
): { finalScore: number; breakdown: MatchScoreBreakdown } {
  const semScore = Math.max(0, Math.min(1, (similarity + 1) / 2));
  const eligibility = eligibilityScore(scholarship, profile);
  const field = fieldAlignmentScore(scholarship, profile);
  const deadline = recencyScore(scholarship.application_deadline);
  const funding = fundingFitScore(scholarship, profile);
  const effort = effortScore(scholarship.effort_minutes);
  const freshness = freshnessScore(scholarship);
  const behavior = behaviorScore(scholarship.id, signals);

  const finalScore =
    0.45 * semScore
    + 0.18 * field
    + 0.12 * eligibility
    + 0.08 * deadline
    + 0.06 * funding
    + 0.04 * effort
    + 0.04 * freshness
    + 0.03 * behavior;

  return {
    finalScore,
    breakdown: {
      semantic: toPct(semScore),
      eligibility: toPct(eligibility),
      field: toPct(field),
      deadline: toPct(deadline),
      funding: toPct(funding),
      effort: toPct(effort),
      freshness: toPct(freshness),
      behavior: toPct(behavior),
    },
  };
}

function buildMatchReasons(
  scholarship: Scholarship & { study_field_slugs?: string[] | null },
  profile: RichProfile,
  breakdown: MatchScoreBreakdown,
  signals: BehaviorSignals,
): string[] {
  const reasons: string[] = [];
  const fieldScore = fieldAlignmentScore(scholarship, profile);
  const scholarshipFieldSlugs = getScholarshipFieldSlugs(scholarship);
  const profileFieldSlug = getProfileFieldSlug(profile);
  const profileFieldName = getStudyFieldName(profileFieldSlug) ?? profile.field_of_study;

  if (
    profile.degree_level
    && (
      scholarship.degree_levels?.includes(profile.degree_level)
      || scholarship.degree_levels?.includes('Any')
    )
  ) {
    reasons.push(`Open to ${profile.degree_level} students`);
  }

  if (fieldScore >= 1.0 && profileFieldName) {
    reasons.push(`Direct match for ${profileFieldName}`);
  } else if (fieldScore >= 0.75 && profileFieldName) {
    reasons.push(`Closely related to ${profileFieldName}`);
  } else if (fieldScore >= 0.45 && scholarshipFieldSlugs.length > 0) {
    reasons.push('Broadly aligned with your academic area');
  }

  if (scholarship.funding_type === 'Full') reasons.push('Fully funded');
  if (scholarship.open_to_international) reasons.push('Open to international students');
  if (scholarship.renewable) reasons.push('Renewable award');

  if (breakdown.eligibility >= 85) reasons.push('Strong eligibility fit');
  if (profile.financial_need && breakdown.funding >= 90) reasons.push('Funding fits your financial need');

  if (scholarship.effort_minutes && scholarship.effort_minutes <= 90) {
    reasons.push(`Quick to apply (~${scholarship.effort_minutes} min)`);
  }

  if (breakdown.deadline >= 90) reasons.push('Deadline is in a good application window');
  if (breakdown.freshness >= 90) reasons.push('Recently verified opportunity');
  if (signals.savedIds.has(scholarship.id)) reasons.push('Already saved by you');
  if (signals.trackedStatuses.has(scholarship.id)) reasons.push(`Already ${signals.trackedStatuses.get(scholarship.id)?.toLowerCase()}`);

  return Array.from(new Set(reasons)).slice(0, 4);
}

async function getUserBehaviorSignals(
  supabase: ReturnType<typeof createAdminClient>,
  userId?: string,
): Promise<BehaviorSignals> {
  if (!userId) return DEFAULT_BEHAVIOR_SIGNALS;

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString();

  const [
    { data: saved },
    { data: tracked },
    { data: events },
  ] = await Promise.all([
    supabase
      .from('saved_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId),
    supabase
      .from('application_tracker')
      .select('scholarship_id, status')
      .eq('user_id', userId),
    supabase
      .from('match_events')
      .select('scholarship_id, event_type, occurred_at')
      .eq('user_id', userId)
      .gte('occurred_at', since)
      .limit(500),
  ]);

  const savedIds = new Set((saved ?? []).map((row: any) => row.scholarship_id));
  const trackedStatuses = new Map(
    (tracked ?? []).map((row: any) => [row.scholarship_id, row.status]),
  );

  const rawEventScores = new Map<string, number>();
  const eventWeights: Record<string, number> = {
    click: 0.04,
    view_detail: 0.04,
    save: 0.08,
    apply_start: 0.12,
    apply_submit: 0.16,
    unsave: -0.04,
    dismiss: -0.14,
    not_relevant: -0.18,
  };

  for (const event of events ?? []) {
    const id = (event as any).scholarship_id;
    const type = (event as any).event_type;
    const weight = eventWeights[type] ?? 0;
    if (!id || weight === 0) continue;

    const occurredAt = new Date((event as any).occurred_at).getTime();
    const ageDays = Number.isFinite(occurredAt)
      ? (Date.now() - occurredAt) / 86_400_000
      : 180;
    const decay = Math.max(0.25, 1 - ageDays / 180);
    rawEventScores.set(id, (rawEventScores.get(id) ?? 0) + weight * decay);
  }

  const eventScores = new Map<string, number>();
  for (const [id, rawScore] of rawEventScores) {
    eventScores.set(id, clamp01(0.5 + Math.max(-0.25, Math.min(0.25, rawScore))));
  }

  return { savedIds, trackedStatuses, eventScores };
}

export async function matchScholarships(
  profile: RichProfile,
  limit = 10,
  userId?: string,
): Promise<MatchResult[]> {
  const supabase = createAdminClient();
  const profileText = buildProfileText(profile);
  const embedding = await generateEmbedding(profileText);
  const behaviorSignals = await getUserBehaviorSignals(supabase, userId);

  let dismissedIds: string[] = [];
  if (userId) {
    const { data } = await supabase
      .from('dismissed_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId);
    dismissedIds = (data ?? []).map((d: any) => d.scholarship_id);
  }

  // Retrieve a wider semantic candidate set, then rerank with structured
  // eligibility and behavior signals. This keeps vector search as retrieval,
  // not the final ranker.
  const fetchCount = Math.min(Math.max(limit * 10, 100), 150);

  const { data, error } = await supabase.rpc('match_scholarships_gated', {
    query_embedding: embedding,
    user_degree: profile.degree_level ?? null,
    user_country: null,
    user_citizenship: profile.citizenship ?? null,
    user_gpa: profile.gpa ?? null,
    match_count: fetchCount,
  });

  if (error) {
    console.error('match_scholarships_gated RPC error:', error);
    return [];
  }

  const rows = (data as any[]) ?? [];

  const scored = rows
    .filter((item) => !dismissedIds.includes(item.id))
    .map((item) => {
      const { finalScore, breakdown } = computeScoreBreakdown(
        item.similarity ?? 0,
        item,
        profile,
        behaviorSignals,
      );

      return { item, finalScore, breakdown };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored.map(({ item, finalScore, breakdown }) => ({
    scholarship: item as Scholarship,
    match_score: Math.min(99, Math.round(finalScore * 100)),
    match_reasons: buildMatchReasons(item, profile, breakdown, behaviorSignals),
    score_breakdown: breakdown,
  }));
}

export async function generateMatchExplanation(
  scholarships: Scholarship[],
  profile: RichProfile,
  opts?: { userId?: string },
): Promise<string> {
  const profileText = buildProfileText(profile);
  const model = process.env.OPENROUTER_MODEL!;
  const profileHash = sha256Hex(`${model}:${profileText}`);
  const topIds = scholarships.slice(0, 5).map((s) => s.id);
  const scholarshipsHash = hashScholarshipIds(topIds);

  const supabase = createAdminClient();

  try {
    const { data: cached } = await supabase
      .from('match_explanation_cache')
      .select('explanation, expires_at')
      .eq('profile_hash', profileHash)
      .eq('scholarships_hash', scholarshipsHash)
      .maybeSingle();

    if (cached?.explanation) {
      const notExpired = !cached.expires_at
        || new Date(cached.expires_at).getTime() > Date.now();
      if (notExpired) return cached.explanation;
    }
  } catch (err) {
    console.warn('match_explanation_cache lookup failed, falling back to live call', err);
  }

  const list = scholarships
    .slice(0, 5)
    .map((s) => `- ${s.name} (${s.country}, ${s.funding_type} funding)`)
    .join('\n');

  const client = getOpenRouterClient();
  const response = await client.chat.completions.create({
    model,
    messages: [{
      role: 'user',
      content:
`You are a scholarship advisor. Be specific and concise - 2 sentences maximum.
Do not mention any scholarships that are not in the list.

Student profile: ${profileText}

Top matched scholarships:
${list}

Explain in 2 sentences why these scholarships match this student.
Reference their field of study and degree level specifically.`,
    }],
    max_tokens: 150,
    temperature: 0.4,
  });

  const explanation = response.choices[0]?.message?.content?.trim() ?? '';

  if (explanation) {
    const expiresAt = new Date(Date.now() + EXPLANATION_TTL_MS).toISOString();
    void supabase
      .from('match_explanation_cache')
      .upsert({
        profile_hash: profileHash,
        scholarships_hash: scholarshipsHash,
        user_id: opts?.userId ?? null,
        explanation,
        model,
        expires_at: expiresAt,
      }, { onConflict: 'profile_hash,scholarships_hash' })
      .then(() => undefined, (err) => console.warn('match_explanation_cache upsert failed', err));
  }

  return explanation;
}
