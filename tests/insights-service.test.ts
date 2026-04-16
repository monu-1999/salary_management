import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDbForTests } from "@/lib/db";
import { createEmployee } from "@/lib/employee-repository";
import {
  getCountrySalaryInsights,
  getJobTitleSalaryInsights,
} from "@/lib/insights-service";
import type { EmployeeInput } from "@/lib/employee-types";
import { createTempDbPath, removeDbArtifacts } from "./db-test-utils";

let dbPath: string;

function employee(overrides: Partial<EmployeeInput>): EmployeeInput {
  return {
    fullName: "Sample Employee",
    email: `${Math.random().toString(36).slice(2)}@example.com`,
    jobTitle: "Software Engineer",
    department: "Engineering",
    country: "India",
    salary: 100,
    currency: "INR",
    employmentType: "Full-time",
    status: "Active",
    hireDate: "2022-01-15",
    ...overrides,
  };
}

beforeEach(() => {
  dbPath = createTempDbPath("salary-insights-test");
  process.env.DB_PATH = dbPath;
  closeDbForTests();
});

afterEach(() => {
  closeDbForTests();
  removeDbArtifacts(dbPath);
  delete process.env.DB_PATH;
});

describe("insights service", () => {
  it("computes country salary insights metrics", () => {
    createEmployee(employee({ salary: 100, jobTitle: "Software Engineer" }));
    createEmployee(employee({ salary: 200, jobTitle: "Software Engineer" }));
    createEmployee(employee({ salary: 300, jobTitle: "HR Manager" }));
    createEmployee(employee({ salary: 400, jobTitle: "HR Manager" }));

    const insights = getCountrySalaryInsights("India");

    expect(insights).not.toBeNull();
    expect(insights?.currency).toBe("INR");
    expect(insights?.headcount).toBe(4);
    expect(insights?.minSalary).toBe(100);
    expect(insights?.maxSalary).toBe(400);
    expect(insights?.averageSalary).toBe(250);
    expect(insights?.medianSalary).toBe(250);
    expect(insights?.p90Salary).toBe(370);
    expect(insights?.totalPayroll).toBe(1000);
    expect(insights?.topJobTitles).toHaveLength(2);
  });

  it("computes job title insights in a country", () => {
    createEmployee(employee({ salary: 120, jobTitle: "Data Analyst" }));
    createEmployee(employee({ salary: 180, jobTitle: "Data Analyst" }));
    createEmployee(employee({ salary: 500, jobTitle: "Engineering Manager" }));

    const jobInsights = getJobTitleSalaryInsights("India", "Data Analyst");

    expect(jobInsights).not.toBeNull();
    expect(jobInsights?.currency).toBe("INR");
    expect(jobInsights?.headcount).toBe(2);
    expect(jobInsights?.averageSalary).toBe(150);
    expect(jobInsights?.minSalary).toBe(120);
    expect(jobInsights?.maxSalary).toBe(180);
  });

  it("returns null when insight scope has no employees", () => {
    expect(getCountrySalaryInsights("Brazil")).toBeNull();
    expect(getJobTitleSalaryInsights("India", "Unknown Role")).toBeNull();
  });
});
