/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SalaryDashboard from "@/components/salary-dashboard";
import type { Employee, EmployeeInput } from "@/lib/employee-types";

function buildEmployee(id: number, overrides: Partial<Employee> = {}): Employee {
  return {
    id,
    fullName: "Alex Johnson",
    email: `alex.${id}@example.com`,
    jobTitle: "Software Engineer",
    department: "Engineering",
    country: "United States",
    salary: 120_000,
    currency: "USD",
    employmentType: "Full-time",
    status: "Active",
    hireDate: "2021-01-01",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  if (status === 204) {
    return new Response(null, { status });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createFetchMock(seed: Employee[]) {
  const employees = [...seed];
  let nextId = Math.max(...employees.map((entry) => entry.id), 0) + 1;

  const groupedOptions = (country?: string) => {
    const countries = Array.from(new Set(employees.map((entry) => entry.country))).sort();
    const scoped = country ? employees.filter((entry) => entry.country === country) : employees;
    const jobTitles = Array.from(new Set(scoped.map((entry) => entry.jobTitle))).sort();

    return { countries, jobTitles };
  };

  const countryInsights = (country: string) => {
    const scoped = employees.filter((entry) => entry.country === country);
    if (scoped.length === 0) {
      return null;
    }

    const salaries = scoped.map((entry) => entry.salary).sort((a, b) => a - b);
    const averageSalary = scoped.reduce((sum, entry) => sum + entry.salary, 0) / scoped.length;

    return {
      country,
      currency: scoped[0].currency,
      headcount: scoped.length,
      minSalary: salaries[0],
      maxSalary: salaries[salaries.length - 1],
      averageSalary,
      medianSalary: salaries[Math.floor((salaries.length - 1) / 2)],
      p90Salary: salaries[Math.floor((salaries.length - 1) * 0.9)],
      totalPayroll: scoped.reduce((sum, entry) => sum + entry.salary, 0),
      topJobTitles: Array.from(new Set(scoped.map((entry) => entry.jobTitle))).map((jobTitle) => {
        const roleEmployees = scoped.filter((entry) => entry.jobTitle === jobTitle);
        return {
          jobTitle,
          headcount: roleEmployees.length,
          averageSalary:
            roleEmployees.reduce((sum, entry) => sum + entry.salary, 0) / roleEmployees.length,
        };
      }),
      employmentTypeDistribution: Array.from(new Set(scoped.map((entry) => entry.employmentType))).map(
        (employmentType) => ({
          employmentType,
          count: scoped.filter((entry) => entry.employmentType === employmentType).length,
        }),
      ),
    };
  };

  const jobTitleInsights = (country: string, jobTitle: string) => {
    const scoped = employees.filter(
      (entry) => entry.country === country && entry.jobTitle === jobTitle,
    );

    if (scoped.length === 0) {
      return null;
    }

    const salaries = scoped.map((entry) => entry.salary);
    return {
      country,
      jobTitle,
      currency: scoped[0].currency,
      headcount: scoped.length,
      averageSalary: salaries.reduce((sum, salary) => sum + salary, 0) / scoped.length,
      minSalary: Math.min(...salaries),
      maxSalary: Math.max(...salaries),
    };
  };

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === "string" ? input : input.toString();
    const url = new URL(requestUrl, "http://localhost");
    const path = url.pathname;
    const method = (init?.method ?? "GET").toUpperCase();

    if (path === "/api/insights/options" && method === "GET") {
      const country = url.searchParams.get("country") || undefined;
      return jsonResponse(groupedOptions(country));
    }

    if (path === "/api/insights/country" && method === "GET") {
      const country = url.searchParams.get("country") ?? "";
      const payload = countryInsights(country);
      if (!payload) {
        return jsonResponse({ error: "No employees found for this country" }, 404);
      }

      return jsonResponse(payload);
    }

    if (path === "/api/insights/job-title" && method === "GET") {
      const country = url.searchParams.get("country") ?? "";
      const jobTitle = url.searchParams.get("jobTitle") ?? "";
      const payload = jobTitleInsights(country, jobTitle);
      if (!payload) {
        return jsonResponse({ error: "No employees found for this job title in the given country" }, 404);
      }

      return jsonResponse(payload);
    }

    if (path === "/api/employees" && method === "GET") {
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
      const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
      const country = (url.searchParams.get("country") ?? "").trim();
      const jobTitle = (url.searchParams.get("jobTitle") ?? "").trim();

      let scoped = [...employees];

      if (search) {
        scoped = scoped.filter((entry) => {
          return [entry.fullName, entry.email, entry.department, entry.jobTitle]
            .join(" ")
            .toLowerCase()
            .includes(search);
        });
      }

      if (country) {
        scoped = scoped.filter((entry) => entry.country === country);
      }

      if (jobTitle) {
        scoped = scoped.filter((entry) => entry.jobTitle === jobTitle);
      }

      scoped.sort((a, b) => b.id - a.id);
      const offset = (page - 1) * pageSize;
      const data = scoped.slice(offset, offset + pageSize);
      const totalPages = scoped.length === 0 ? 0 : Math.ceil(scoped.length / pageSize);

      return jsonResponse({
        data,
        pagination: {
          page,
          pageSize,
          total: scoped.length,
          totalPages,
        },
      });
    }

    if (path === "/api/employees" && method === "POST") {
      const payload = JSON.parse(String(init?.body ?? "{}")) as EmployeeInput;
      const createdEmployee: Employee = {
        id: nextId,
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        jobTitle: payload.jobTitle.trim(),
        department: payload.department.trim(),
        country: payload.country.trim(),
        salary: Number(payload.salary),
        currency: payload.currency.trim().toUpperCase(),
        employmentType: payload.employmentType,
        status: payload.status,
        hireDate: payload.hireDate,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      nextId += 1;
      employees.push(createdEmployee);
      return jsonResponse(createdEmployee, 201);
    }

    if (path.match(/^\/api\/employees\/\d+$/) && method === "DELETE") {
      const id = Number(path.split("/").pop());
      const index = employees.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return jsonResponse({ error: "Employee not found" }, 404);
      }

      employees.splice(index, 1);
      return jsonResponse(null, 204);
    }

    return jsonResponse({ error: `Unhandled ${method} ${path}` }, 500);
  });
}

describe("SalaryDashboard", () => {
  const originalFetch = global.fetch;
  const originalConfirm = window.confirm;

  beforeEach(() => {
    const seed = [
      buildEmployee(1, { fullName: "Jane Doe", email: "jane@example.com", salary: 100_000 }),
      buildEmployee(2, { fullName: "John Smith", email: "john@example.com", salary: 180_000 }),
    ];

    global.fetch = createFetchMock(seed) as unknown as typeof fetch;
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    window.confirm = originalConfirm;
    vi.restoreAllMocks();
  });

  it("renders employee data and salary insights", async () => {
    render(<SalaryDashboard />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(await screen.findByText("John Smith")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salary Insights" }));

    expect(await screen.findByText("Top Job Titles by Headcount")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Software Engineer in United States" })).toBeInTheDocument();
    expect(await screen.findByText("$180,000")).toBeInTheDocument();
  });

  it("creates and deletes an employee from the dashboard", async () => {
    render(<SalaryDashboard />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Employee" }));

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Morgan Lee" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "morgan.lee@example.com" } });
    fireEvent.change(screen.getByLabelText("Job Title"), { target: { value: "Data Analyst" } });
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "Analytics" } });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "United States" } });
    fireEvent.change(screen.getByLabelText("Salary"), { target: { value: "95000" } });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "usd" } });
    fireEvent.change(screen.getByLabelText("Hire Date"), { target: { value: "2022-05-10" } });

    fireEvent.click(screen.getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByText("Employee created successfully")).toBeInTheDocument();
    const newEmployeeName = await screen.findByText("Morgan Lee");
    const row = newEmployeeName.closest("tr");
    expect(row).not.toBeNull();

    const deleteButton = within(row as HTMLTableRowElement).getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText("Morgan Lee")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Employee deleted successfully")).toBeInTheDocument();
  });
});
