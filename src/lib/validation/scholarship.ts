import { z } from "zod";

const countries = ["UK", "USA", "Germany", "Canada"] as const;
const fundingTypes = [
  "Full",
  "Partial",
  "Tuition Only",
  "Living Allowance",
] as const;
const degreeLevels = ["Undergraduate", "Masters", "PhD", "Any"] as const;

const trimmedString = z.string().trim();

const scholarshipBaseSchema = z.object({
  name: trimmedString.min(1).max(200),
  provider: trimmedString.min(1).max(200),
  country: z.enum(countries),
  funding_type: z.enum(fundingTypes),
  funding_amount: trimmedString.min(1).max(250),
  description: trimmedString.min(1).max(3000),
  application_url: z.url().max(2048),
  application_deadline: z
    .union([z.string().date(), z.null()])
    .optional()
    .transform((value) => value ?? null),
  degree_levels: z
    .array(z.enum(degreeLevels))
    .min(1)
    .max(degreeLevels.length)
    .transform((values) => Array.from(new Set(values))),
  fields_of_study: z
    .array(trimmedString.min(1).max(100))
    .max(30)
    .transform((values) => Array.from(new Set(values))),
  eligibility_criteria: z
    .array(trimmedString.min(1).max(300))
    .max(30)
    .transform((values) => Array.from(new Set(values))),
  is_active: z.boolean().optional().default(true),
});

export const scholarshipCreateSchema = scholarshipBaseSchema.strict();
export const scholarshipUpdateSchema = scholarshipBaseSchema.partial().strict();

export type ScholarshipCreateInput = z.infer<typeof scholarshipCreateSchema>;
export type ScholarshipUpdateInput = z.infer<typeof scholarshipUpdateSchema>;
