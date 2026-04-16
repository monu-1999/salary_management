import { getDb } from "@/lib/db";
import type {
  CountrySalaryInsights,
  EmploymentType,
  JobTitleSalaryInsights,
} from "@/lib/employee-types";

function percentile(sortedValues: number[], value: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const position = (sortedValues.length - 1) * value;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
}

export function getCountrySalaryInsights(country: string): CountrySalaryInsights | null {
  const db = getDb();

  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*) as headcount,
        MIN(salary) as minSalary,
        MAX(salary) as maxSalary,
        AVG(salary) as averageSalary,
        SUM(salary) as totalPayroll
      FROM employees
      WHERE country = ?
      `,
    )
    .get(country) as {
    headcount: number;
    minSalary: number | null;
    maxSalary: number | null;
    averageSalary: number | null;
    totalPayroll: number | null;
  };

  if (summary.headcount === 0 || summary.minSalary === null || summary.maxSalary === null) {
    return null;
  }

  const salaryRows = db
    .prepare("SELECT salary FROM employees WHERE country = ? ORDER BY salary ASC")
    .all(country) as Array<{ salary: number }>;
  const salaries = salaryRows.map((row) => row.salary);

  const topJobTitles = db
    .prepare(
      `
      SELECT
        job_title as jobTitle,
        COUNT(*) as headcount,
        AVG(salary) as averageSalary
      FROM employees
      WHERE country = ?
      GROUP BY job_title
      ORDER BY headcount DESC, averageSalary DESC
      LIMIT 5
      `,
    )
    .all(country) as Array<{
    jobTitle: string;
    headcount: number;
    averageSalary: number;
  }>;

  const employmentTypeDistribution = db
    .prepare(
      `
      SELECT
        employment_type as employmentType,
        COUNT(*) as count
      FROM employees
      WHERE country = ?
      GROUP BY employment_type
      ORDER BY count DESC
      `,
    )
    .all(country) as Array<{
    employmentType: EmploymentType;
    count: number;
  }>;

  const dominantCurrency = db
    .prepare(
      `
      SELECT currency
      FROM employees
      WHERE country = ?
      GROUP BY currency
      ORDER BY COUNT(*) DESC
      LIMIT 1
      `,
    )
    .get(country) as { currency: string } | undefined;

  return {
    country,
    currency: dominantCurrency?.currency ?? "USD",
    headcount: summary.headcount,
    minSalary: summary.minSalary,
    maxSalary: summary.maxSalary,
    averageSalary: summary.averageSalary ?? 0,
    medianSalary: percentile(salaries, 0.5),
    p90Salary: percentile(salaries, 0.9),
    totalPayroll: summary.totalPayroll ?? 0,
    topJobTitles,
    employmentTypeDistribution,
  };
}

export function getJobTitleSalaryInsights(
  country: string,
  jobTitle: string,
): JobTitleSalaryInsights | null {
  const db = getDb();

  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) as headcount,
        AVG(salary) as averageSalary,
        MIN(salary) as minSalary,
        MAX(salary) as maxSalary
      FROM employees
      WHERE country = ? AND job_title = ?
      `,
    )
    .get(country, jobTitle) as {
    headcount: number;
    averageSalary: number | null;
    minSalary: number | null;
    maxSalary: number | null;
  };

  if (row.headcount === 0 || row.averageSalary === null || row.minSalary === null || row.maxSalary === null) {
    return null;
  }

  const dominantCurrency = db
    .prepare(
      `
      SELECT currency
      FROM employees
      WHERE country = ? AND job_title = ?
      GROUP BY currency
      ORDER BY COUNT(*) DESC
      LIMIT 1
      `,
    )
    .get(country, jobTitle) as { currency: string } | undefined;

  return {
    country,
    jobTitle,
    currency: dominantCurrency?.currency ?? "USD",
    headcount: row.headcount,
    averageSalary: row.averageSalary,
    minSalary: row.minSalary,
    maxSalary: row.maxSalary,
  };
}
