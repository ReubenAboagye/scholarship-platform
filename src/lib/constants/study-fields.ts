export type StudyFieldNode = {
  slug: string;
  name: string;
  parentSlug: string | null;
  kind: "group" | "field";
};

const STUDY_FIELD_NODES: StudyFieldNode[] = [
  { slug: "academic", name: "Academic", parentSlug: null, kind: "group" },
  { slug: "sciences", name: "Sciences", parentSlug: "academic", kind: "group" },
  { slug: "society", name: "Society", parentSlug: "academic", kind: "group" },
  { slug: "humanities", name: "Humanities", parentSlug: "academic", kind: "group" },
  { slug: "computing-engineering", name: "Computing & Engineering", parentSlug: "sciences", kind: "group" },
  { slug: "natural-environment", name: "Natural & Environmental Sciences", parentSlug: "sciences", kind: "group" },
  { slug: "health", name: "Health", parentSlug: "sciences", kind: "group" },
  { slug: "policy-social", name: "Policy & Social Sciences", parentSlug: "society", kind: "group" },
  { slug: "business-economics", name: "Business & Economics", parentSlug: "society", kind: "group" },
  { slug: "arts-law", name: "Arts, Design & Law", parentSlug: "humanities", kind: "group" },
  { slug: "agriculture-group", name: "Agriculture", parentSlug: "sciences", kind: "group" },
  { slug: "other-discipline", name: "Other", parentSlug: "academic", kind: "group" },

  { slug: "architecture", name: "Architecture", parentSlug: "arts-law", kind: "field" },
  { slug: "agriculture", name: "Agriculture", parentSlug: "agriculture-group", kind: "field" },
  { slug: "arts-humanities", name: "Arts & Humanities", parentSlug: "arts-law", kind: "field" },
  { slug: "business-management", name: "Business & Management", parentSlug: "business-economics", kind: "field" },
  { slug: "computer-science", name: "Computer Science", parentSlug: "computing-engineering", kind: "field" },
  { slug: "economics", name: "Economics", parentSlug: "business-economics", kind: "field" },
  { slug: "education", name: "Education", parentSlug: "policy-social", kind: "field" },
  { slug: "engineering", name: "Engineering", parentSlug: "computing-engineering", kind: "field" },
  { slug: "environmental-studies", name: "Environmental Studies", parentSlug: "natural-environment", kind: "field" },
  { slug: "law", name: "Law", parentSlug: "arts-law", kind: "field" },
  { slug: "journalism", name: "Journalism", parentSlug: "arts-law", kind: "field" },
  { slug: "mathematics", name: "Mathematics", parentSlug: "natural-environment", kind: "field" },
  { slug: "biology", name: "Biology", parentSlug: "natural-environment", kind: "field" },
  { slug: "chemistry", name: "Chemistry", parentSlug: "natural-environment", kind: "field" },
  { slug: "medicine", name: "Medicine", parentSlug: "health", kind: "field" },
  { slug: "pharmacy", name: "Pharmacy", parentSlug: "health", kind: "field" },
  { slug: "natural-sciences", name: "Natural Sciences", parentSlug: "natural-environment", kind: "field" },
  { slug: "political-science", name: "Political Science", parentSlug: "policy-social", kind: "field" },
  { slug: "development-studies", name: "Development Studies", parentSlug: "policy-social", kind: "field" },
  { slug: "peace-conflict-studies", name: "Peace & Conflict Studies", parentSlug: "policy-social", kind: "field" },
  { slug: "psychology", name: "Psychology", parentSlug: "policy-social", kind: "field" },
  { slug: "public-health", name: "Public Health", parentSlug: "health", kind: "field" },
  { slug: "public-policy", name: "Public Policy", parentSlug: "policy-social", kind: "field" },
  { slug: "social-sciences", name: "Social Sciences", parentSlug: "policy-social", kind: "field" },
  { slug: "other", name: "Other", parentSlug: "other-discipline", kind: "field" },
];

const FIELD_ALIASES: Record<string, string[]> = {
  architecture: ["architecture", "built environment", "urban design"],
  agriculture: ["agriculture", "agricultural science", "agricultural sciences", "agronomy"],
  "arts-humanities": ["arts & humanities", "arts and humanities", "humanities", "liberal arts"],
  "business-management": ["business", "business & management", "business and management", "management", "mba"],
  "computer-science": ["computer science", "computing", "software engineering", "information technology", "data science", "technology"],
  economics: ["economics", "economic policy", "economy"],
  education: ["education", "teaching", "curriculum studies"],
  engineering: ["engineering", "mechanical engineering", "civil engineering", "electrical engineering", "chemical engineering"],
  "environmental-studies": ["environmental studies", "environmental science", "sustainability studies", "sustainability"],
  law: ["law", "legal studies", "jurisprudence"],
  journalism: ["journalism", "media studies", "communications"],
  mathematics: ["mathematics", "math", "statistics", "applied mathematics"],
  biology: ["biology", "life sciences"],
  chemistry: ["chemistry", "chemical sciences"],
  medicine: ["medicine", "medical science", "clinical medicine", "biomedical science", "health sciences"],
  pharmacy: ["pharmacy", "pharmaceutical sciences"],
  "natural-sciences": ["natural sciences", "science", "physics"],
  "political-science": ["political science", "international relations", "governance"],
  "development-studies": ["development studies", "international development"],
  "peace-conflict-studies": ["peace studies", "conflict resolution", "peace and conflict studies", "conflict studies"],
  psychology: ["psychology", "behavioral science", "behavioural science"],
  "public-health": ["public health", "global health", "epidemiology", "healthcare"],
  "public-policy": ["public policy", "policy studies", "development policy", "social policy"],
  "social-sciences": ["social sciences", "sociology", "anthropology", "development studies"],
  other: ["other", "general studies", "interdisciplinary studies"],
};

const slugMap = new Map(STUDY_FIELD_NODES.map((node) => [node.slug, node]));

const aliasToSlug = new Map<string, string>();
for (const node of STUDY_FIELD_NODES) {
  if (node.kind === "field") {
    aliasToSlug.set(node.name.toLowerCase(), node.slug);
  }
}

for (const [slug, aliases] of Object.entries(FIELD_ALIASES)) {
  for (const alias of aliases) {
    aliasToSlug.set(alias.toLowerCase(), slug);
  }
}

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const normalizedAliasToSlug = new Map<string, string>();
for (const [alias, slug] of aliasToSlug.entries()) {
  normalizedAliasToSlug.set(normalizeLabel(alias), slug);
}

function getAncestors(slug: string): string[] {
  const ancestors: string[] = [];
  let cursor = slugMap.get(slug)?.parentSlug ?? null;

  while (cursor) {
    ancestors.push(cursor);
    cursor = slugMap.get(cursor)?.parentSlug ?? null;
  }

  return ancestors;
}

export const STUDY_FIELDS = STUDY_FIELD_NODES.filter((node) => node.kind === "field");
export const STUDY_FIELD_OPTIONS = STUDY_FIELDS.map(({ slug, name }) => ({ slug, name }));
export const STUDY_FIELD_NAME_MAP = new Map(STUDY_FIELDS.map((field) => [field.slug, field.name]));
export const POPULAR_STUDY_FIELD_SLUGS = [
  "business-management",
  "computer-science",
  "engineering",
  "medicine",
  "law",
  "economics",
  "education",
  "natural-sciences",
  "social-sciences",
  "public-policy",
  "arts-humanities",
  "public-health",
  "mathematics",
  "biology",
  "chemistry",
  "agriculture",
  "architecture",
  "psychology",
];

export function getStudyFieldName(slug: string | null | undefined) {
  if (!slug) return null;
  return STUDY_FIELD_NAME_MAP.get(slug) ?? null;
}

export function resolveStudyFieldSlug(label: string | null | undefined) {
  if (!label) return null;
  if (label.trim().toLowerCase() === "any") return null;

  const normalized = normalizeLabel(label);
  if (!normalized) return null;

  const direct = normalizedAliasToSlug.get(normalized);
  if (direct) return direct;

  for (const [alias, slug] of normalizedAliasToSlug.entries()) {
    if (
      alias.length >= 4
      && (alias.includes(normalized) || normalized.includes(alias))
    ) {
      return slug;
    }
  }

  return null;
}

export function resolveStudyFieldSlugs(labels: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      labels
        .map((label) => resolveStudyFieldSlug(label))
        .filter((slug): slug is string => Boolean(slug))
    )
  );
}

export function computeStudyFieldAlignment(
  profileFieldSlug: string | null | undefined,
  scholarshipFieldSlugs: string[]
) {
  if (!scholarshipFieldSlugs.length) return 0.5;
  if (!profileFieldSlug) return 0.0;
  if (scholarshipFieldSlugs.includes(profileFieldSlug)) return 1.0;

  const profileAncestors = getAncestors(profileFieldSlug);
  const scholarshipAncestorSets = scholarshipFieldSlugs.map((slug) => new Set(getAncestors(slug)));

  if (scholarshipAncestorSets.some((set) => set.has(slugMap.get(profileFieldSlug)?.parentSlug ?? ""))) {
    return 0.75;
  }

  const sharedAncestor = scholarshipAncestorSets.some((set) =>
    profileAncestors.some((ancestor) => ancestor !== "academic" && set.has(ancestor))
  );

  if (sharedAncestor) return 0.45;
  return 0.0;
}
