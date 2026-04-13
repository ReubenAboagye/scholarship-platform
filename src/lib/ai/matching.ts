import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';
import type { MatchResult, UserProfile, Scholarship } from '@/types';

// OpenRouter: used for chat/inference (cheap, model-flexible)
function getOpenRouterClient() {
  return new OpenAI({
    apiKey:  process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title':      'ScholarMatch',
    },
  });
}

// OpenAI: used for embeddings only (OpenRouter does not support this endpoint)
function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

// ── Embeddings (OpenAI — required for pgvector) ──────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai   = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// ── Profile text builder ─────────────────────────────────────
export function buildProfileText(profile: Partial<UserProfile>): string {
  const parts = [
    profile.field_of_study    && `Field of study: ${profile.field_of_study}`,
    profile.degree_level      && `Degree level: ${profile.degree_level}`,
    profile.country_of_origin && `Country: ${profile.country_of_origin}`,
    profile.gpa               && `GPA: ${profile.gpa}`,
    profile.bio               && `Background: ${profile.bio}`,
  ].filter(Boolean);
  return parts.join('. ') || 'General student seeking scholarships';
}

// ── Vector similarity search via Supabase pgvector ───────────
export async function matchScholarships(
  profile: Partial<UserProfile>,
  limit = 10
): Promise<MatchResult[]> {
  const supabase    = createAdminClient();
  const profileText = buildProfileText(profile);
  const embedding   = await generateEmbedding(profileText);

  const { data, error } = await supabase.rpc('match_scholarships', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count:     limit,
  });

  if (error) { console.error('Matching error:', error); return []; }

  return (data as any[]).map((item) => ({
    scholarship:   item as Scholarship,
    match_score:   Math.round(item.similarity * 100),
    match_reasons: generateMatchReasons(item, profile),
  }));
}

function generateMatchReasons(scholarship: any, profile: Partial<UserProfile>): string[] {
  const reasons: string[] = [];
  if (profile.degree_level && scholarship.degree_levels?.includes(profile.degree_level))
    reasons.push(`Matches your ${profile.degree_level} degree level`);
  if (profile.field_of_study && scholarship.fields_of_study?.some((f: string) =>
    f.toLowerCase().includes(profile.field_of_study!.toLowerCase())))
    reasons.push(`Relevant to your field: ${profile.field_of_study}`);
  if (scholarship.funding_type === 'Full')
    reasons.push('Fully funded opportunity');
  return reasons.length > 0 ? reasons : ['Strong profile match based on academic background'];
}

// ── AI explanation via OpenRouter ────────────────────────────
export async function generateMatchExplanation(
  scholarships: Scholarship[],
  profile: Partial<UserProfile>
): Promise<string> {
  const profileText = buildProfileText(profile);
  const list = scholarships
    .slice(0, 5)
    .map((s) => `- ${s.name} (${s.country}, ${s.funding_type} funding)`)
    .join('\n');

  const client   = getOpenRouterClient();
  const response = await client.chat.completions.create({
    model:       process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001',
    messages: [{
      role:    'user',
      content: `You are a scholarship advisor. Student profile: ${profileText}\n\nTop matches:\n${list}\n\nIn 2-3 sentences, explain why these are a good fit. Be encouraging and specific.`,
    }],
    max_tokens:  200,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? '';
}
