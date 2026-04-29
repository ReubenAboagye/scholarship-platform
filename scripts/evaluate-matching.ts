import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { matchScholarships } from "../src/lib/ai/matching";

type Relevance = 0 | 1 | 2 | 3;

type EvalLabel = {
  scholarship_id: string;
  relevance: Relevance;
};

type EvalCase = {
  profile_id: string;
  labels: EvalLabel[];
};

type EvalDataset = {
  cases: EvalCase[];
};

function precisionAtK(
  rankedIds: string[],
  labels: Map<string, Relevance>,
  k: number,
  threshold = 2,
) {
  const topK = rankedIds.slice(0, k);
  if (!topK.length) return 0;

  const hits = topK.filter((id) => (labels.get(id) ?? 0) >= threshold).length;
  return hits / topK.length;
}

function ndcgAtK(rankedIds: string[], labels: Map<string, Relevance>, k: number) {
  const dcg = rankedIds.slice(0, k).reduce((sum, id, index) => {
    const rel = labels.get(id) ?? 0;
    return sum + (Math.pow(2, rel) - 1) / Math.log2(index + 2);
  }, 0);

  const ideal = [...labels.values()].sort((a, b) => b - a).slice(0, k);
  const idcg = ideal.reduce((sum, rel, index) => {
    return sum + (Math.pow(2, rel) - 1) / Math.log2(index + 2);
  }, 0);

  return idcg === 0 ? 0 : dcg / idcg;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function loadDataset(fileArg?: string) {
  const filePath = fileArg
    ? path.resolve(process.cwd(), fileArg)
    : path.resolve(process.cwd(), "scripts", "matching-eval.sample.json");

  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as EvalDataset;
}

async function main() {
  const dataset = await loadDataset(process.argv[2]);
  if (!dataset.cases.length) {
    console.log("No evaluation cases found. Populate scripts/matching-eval.sample.json first.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const precision5: number[] = [];
  const precision10: number[] = [];
  const ndcg10: number[] = [];

  for (const testCase of dataset.cases) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, country_of_origin, field_of_study, primary_field_slug, degree_level, gpa, bio, citizenship, career_goals, interests, extracurriculars, financial_need")
      .eq("id", testCase.profile_id)
      .single();

    if (error || !profile) {
      console.warn(`Skipping ${testCase.profile_id}: profile not found.`);
      continue;
    }

    const results = await matchScholarships(profile as any, 10, testCase.profile_id);
    const rankedIds = results.map((result) => result.scholarship.id);
    const labels = new Map<string, Relevance>(
      testCase.labels.map((label) => [label.scholarship_id, label.relevance])
    );

    precision5.push(precisionAtK(rankedIds, labels, 5));
    precision10.push(precisionAtK(rankedIds, labels, 10));
    ndcg10.push(ndcgAtK(rankedIds, labels, 10));

    console.log(
      `${testCase.profile_id}: P@5=${precisionAtK(rankedIds, labels, 5).toFixed(2)} `
      + `P@10=${precisionAtK(rankedIds, labels, 10).toFixed(2)} `
      + `NDCG@10=${ndcgAtK(rankedIds, labels, 10).toFixed(2)}`
    );
  }

  console.log("");
  console.log(`Cases evaluated: ${precision10.length}`);
  console.log(`Average Precision@5:  ${average(precision5).toFixed(3)}`);
  console.log(`Average Precision@10: ${average(precision10).toFixed(3)}`);
  console.log(`Average NDCG@10:      ${average(ndcg10).toFixed(3)}`);
}

main().catch((error) => {
  console.error("Matching evaluation failed:", error);
  process.exit(1);
});
