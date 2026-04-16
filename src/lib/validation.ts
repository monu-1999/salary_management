import { z } from "zod";

const employmentTypes = ["Full-time", "Part-time", "Contract", "Intern"] as const;
const employeeStatuses = ["Active", "On Leave", "Resigned"] as const;

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(120),
  jobTitle: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  salary: z.coerce.number().int().positive().max(5_000_000),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  employmentType: z.enum(employmentTypes),
  status: z.enum(employeeStatuses),
  hireDate: z
    .string()
    .trim()
    .refine((value) => isValidIsoDate(value), "Expected a valid YYYY-MM-DD date"),
});

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().trim().optional(),
  country: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
});

export const countryQuerySchema = z.object({
  country: z.string().trim().min(2),
});

export const jobTitleInsightsQuerySchema = z.object({
  country: z.string().trim().min(2),
  jobTitle: z.string().trim().min(2),
});
