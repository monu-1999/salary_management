import { describe, expect, it } from "vitest";
import { employeeInputSchema, employeeListQuerySchema } from "@/lib/validation";

describe("employeeInputSchema", () => {
  it("parses a valid employee payload", () => {
    const parsed = employeeInputSchema.parse({
      fullName: "Jane Cooper",
      email: "jane@example.com",
      jobTitle: "Software Engineer",
      department: "Engineering",
      country: "United States",
      salary: 120000,
      currency: "usd",
      employmentType: "Full-time",
      status: "Active",
      hireDate: "2024-06-15",
    });

    expect(parsed.currency).toBe("USD");
    expect(parsed.salary).toBe(120000);
  });

  it("rejects invalid salary and malformed date", () => {
    const result = employeeInputSchema.safeParse({
      fullName: "Jane Cooper",
      email: "jane@example.com",
      jobTitle: "Software Engineer",
      department: "Engineering",
      country: "United States",
      salary: -50,
      currency: "USD",
      employmentType: "Full-time",
      status: "Active",
      hireDate: "2024-99-99",
    });

    expect(result.success).toBe(false);
  });
});

describe("employeeListQuerySchema", () => {
  it("applies pagination defaults", () => {
    const parsed = employeeListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("enforces valid pagination bounds", () => {
    const result = employeeListQuerySchema.safeParse({ page: 0, pageSize: 999 });
    expect(result.success).toBe(false);
  });
});
