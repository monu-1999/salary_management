import type Database from "better-sqlite3";

const schemaSql = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  country TEXT NOT NULL,
  salary INTEGER NOT NULL CHECK (salary > 0),
  currency TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  status TEXT NOT NULL,
  hire_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_country_job ON employees(country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_job_title ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
`;

export function runSchemaMigrations(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(schemaSql);
}
