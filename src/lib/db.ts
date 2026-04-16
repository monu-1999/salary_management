import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { runSchemaMigrations } from "@/lib/schema";

declare global {
  // eslint-disable-next-line no-var
  var salaryDb: Database.Database | undefined;
}

function databasePath(): string {
  return process.env.DB_PATH ?? path.join(process.cwd(), "sqlite", "salary.db");
}

function initializeDatabase(): Database.Database {
  const dbPath = databasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  runSchemaMigrations(db);

  return db;
}

export function getDb(): Database.Database {
  if (!global.salaryDb) {
    global.salaryDb = initializeDatabase();
  }

  return global.salaryDb;
}

export function closeDbForTests(): void {
  if (global.salaryDb) {
    global.salaryDb.close();
    global.salaryDb = undefined;
  }
}
