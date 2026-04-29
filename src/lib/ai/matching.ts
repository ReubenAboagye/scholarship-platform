import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import {
  computeStudyFieldAlignment,
  getStudyFieldName,
  resolveStudyFieldSlug,
  resolveStudyFieldSlugs,
} from '@/lib/constants/study-fields';
import type { MatchResult, UserProfile, Scholarship } from '@/types';

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
      .select('embedding')
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

function computeFinalScore(
  similarity: number,
  scholarship: Scholarship & { study_field_slugs?: string[] | null },
  profile: RichProfile,
): number {
  const semScore = Math.max(0, Math.min(1, (similarity + 1) / 2));
  const recency = recencyScore(scholarship.application_deadline);
  const fieldBoost = fieldAlignmentScore(scholarship, profile);

  return 0.60 * semScore
       + 0.15 * recency
       + 0.25 * fieldBoost;
}

function buildMatchReasons(
  scholarship: Scholarship & { study_field_slugs?: string[] | null },
  profile: RichProfile,
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

  if (scholarship.effort_minutes && scholarship.effort_minutes <= 90) {
    reasons.push(`Quick to apply (~${scholarship.effort_minutes} min)`);
  }

  return reasons.slice(0, 3);
}

export async function matchScholarships(
  profile: RichProfile,
  limit = 10,
  userId?: string,
): Promise<MatchResult[]> {
  const supabase = createAdminClient();
  const profileText = buildProfileText(profile);
  const embedding = await generateEmbedding(profileText);

  let dismissedIds: string[] = [];
  if (userId) {
    const { data } = await supabase
      .from('dismissed_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId);
    dismissedIds = (data ?? []).map((d: any) => d.scholarship_id);
  }

  const fetchCount = Math.min(limit * 3, 30);

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
    .map((item) => ({
      item,
      finalScore: computeFinalScore(item.similarity ?? 0, item, profile),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored.map(({ item, finalScore }) => ({
    scholarship: item as Scholarship,
    match_score: Math.min(99, Math.round(finalScore * 100)),
    match_reasons: buildMatchReasons(item, profile),
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
