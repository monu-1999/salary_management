import { getDb } from "@/lib/db";
import type {
  Employee,
  EmployeeInput,
  EmployeeListFilters,
  PagedEmployees,
} from "@/lib/employee-types";

interface EmployeeRow {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  employment_type: Employee["employmentType"];
  status: Employee["status"];
  hire_date: string;
  created_at: string;
  updated_at: string;
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    jobTitle: row.job_title,
    department: row.department,
    country: row.country,
    salary: row.salary,
    currency: row.currency,
    employmentType: row.employment_type,
    status: row.status,
    hireDate: row.hire_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function whereSqlFromFilters(filters: EmployeeListFilters): {
  clause: string;
  params: unknown[];
} {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const searchTerm = `%${filters.search.replace(/\s+/g, "%")}%`;
    clauses.push(
      "(full_name LIKE ? OR email LIKE ? OR department LIKE ? OR job_title LIKE ?)",
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (filters.country) {
    clauses.push("country = ?");
    params.push(filters.country);
  }

  if (filters.jobTitle) {
    clauses.push("job_title = ?");
    params.push(filters.jobTitle);
  }

  const clause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { clause, params };
}

export function listEmployees(filters: EmployeeListFilters): PagedEmployees {
  const db = getDb();
  const { clause, params } = whereSqlFromFilters(filters);
  const offset = (filters.page - 1) * filters.pageSize;

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM employees ${clause}`)
    .get(...params) as { count: number };

  const rows = db
    .prepare(
      `
      SELECT
        id,
        full_name,
        email,
        job_title,
        department,
        country,
        salary,
        currency,
        employment_type,
        status,
        hire_date,
        created_at,
        updated_at
      FROM employees
      ${clause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
    )
    .all(...params, filters.pageSize, offset) as EmployeeRow[];

  const totalPages = totalRow.count === 0 ? 0 : Math.ceil(totalRow.count / filters.pageSize);

  return {
    data: rows.map(mapEmployee),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalRow.count,
      totalPages,
    },
  };
}

export function getEmployeeById(id: number): Employee | null {
  const db = getDb();

  const row = db
    .prepare(
      `
      SELECT
        id,
        full_name,
        email,
        job_title,
        department,
        country,
        salary,
        currency,
        employment_type,
        status,
        hire_date,
        created_at,
        updated_at
      FROM employees
      WHERE id = ?
      `,
    )
    .get(id) as EmployeeRow | undefined;

  return row ? mapEmployee(row) : null;
}

export function createEmployee(input: EmployeeInput): Employee {
  const db = getDb();
  const timestamp = new Date().toISOString();

  const result = db
    .prepare(
      `
      INSERT INTO employees (
        full_name,
        email,
        job_title,
        department,
        country,
        salary,
        currency,
        employment_type,
        status,
        hire_date,
        created_at,
        updated_at
      )
      VALUES (
        @fullName,
        @email,
        @jobTitle,
        @department,
        @country,
        @salary,
        @currency,
        @employmentType,
        @status,
        @hireDate,
        @createdAt,
        @updatedAt
      )
      `,
    )
    .run({
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

  return getEmployeeById(Number(result.lastInsertRowid)) as Employee;
}

export function updateEmployee(id: number, input: EmployeeInput): Employee | null {
  const db = getDb();
  const timestamp = new Date().toISOString();

  const result = db
    .prepare(
      `
      UPDATE employees
      SET
        full_name = @fullName,
        email = @email,
        job_title = @jobTitle,
        department = @department,
        country = @country,
        salary = @salary,
        currency = @currency,
        employment_type = @employmentType,
        status = @status,
        hire_date = @hireDate,
        updated_at = @updatedAt
      WHERE id = @id
      `,
    )
    .run({
      id,
      ...input,
      updatedAt: timestamp,
    });

  if (result.changes === 0) {
    return null;
  }

  return getEmployeeById(id);
}

export function deleteEmployee(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM employees WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listCountries(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT country FROM employees ORDER BY country ASC")
    .all() as Array<{ country: string }>;

  return rows.map((row) => row.country);
}

export function listJobTitles(country?: string): string[] {
  const db = getDb();

  if (country) {
    const rows = db
      .prepare(
        "SELECT DISTINCT job_title FROM employees WHERE country = ? ORDER BY job_title ASC",
      )
      .all(country) as Array<{ job_title: string }>;
    return rows.map((row) => row.job_title);
  }

  const rows = db
    .prepare("SELECT DISTINCT job_title FROM employees ORDER BY job_title ASC")
    .all() as Array<{ job_title: string }>;

  return rows.map((row) => row.job_title);
}
