import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDbForTests } from "@/lib/db";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listCountries,
  listEmployees,
  listJobTitles,
  updateEmployee,
} from "@/lib/employee-repository";
import type { EmployeeInput } from "@/lib/employee-types";
import { createTempDbPath, removeDbArtifacts } from "./db-test-utils";

let dbPath: string;

function sampleEmployee(overrides: Partial<EmployeeInput> = {}): EmployeeInput {
  return {
    fullName: "Alex Morgan",
    email: `alex.${Math.random().toString(36).slice(2)}@example.com`,
    jobTitle: "Software Engineer",
    department: "Engineering",
    country: "United States",
    salary: 140000,
    currency: "USD",
    employmentType: "Full-time",
    status: "Active",
    hireDate: "2021-03-11",
    ...overrides,
  };
}

beforeEach(() => {
  dbPath = createTempDbPath("salary-repo-test");
  process.env.DB_PATH = dbPath;
  closeDbForTests();
});

afterEach(() => {
  closeDbForTests();
  removeDbArtifacts(dbPath);
  delete process.env.DB_PATH;
});

describe("employee repository", () => {
  it("creates, fetches, updates, and deletes employees", () => {
    const created = createEmployee(sampleEmployee());
    expect(created.id).toBeGreaterThan(0);

    const fetched = getEmployeeById(created.id);
    expect(fetched?.email).toBe(created.email);

    const updated = updateEmployee(
      created.id,
      sampleEmployee({ email: created.email, salary: 160000, status: "On Leave" }),
    );

    expect(updated?.salary).toBe(160000);
    expect(updated?.status).toBe("On Leave");

    const deleted = deleteEmployee(created.id);
    expect(deleted).toBe(true);
    expect(getEmployeeById(created.id)).toBeNull();
  });

  it("supports search and country/job-title filters", () => {
    createEmployee(
      sampleEmployee({
        fullName: "Priya Shah",
        email: "priya@example.com",
        country: "India",
        jobTitle: "HR Manager",
        department: "People Operations",
      }),
    );

    createEmployee(
      sampleEmployee({
        fullName: "John Doe",
        email: "john@example.com",
        country: "United States",
        jobTitle: "Software Engineer",
      }),
    );

    const result = listEmployees({
      page: 1,
      pageSize: 20,
      search: "Priya",
      country: "India",
      jobTitle: "HR Manager",
    });

    expect(result.pagination.total).toBe(1);
    expect(result.data[0]?.fullName).toBe("Priya Shah");
    expect(listCountries()).toEqual(["India", "United States"]);
    expect(listJobTitles("India")).toEqual(["HR Manager"]);
  });
});
