import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { removeDbArtifacts } from "./db-test-utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const seedScript = require("../scripts/seed.js");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "salary-seed-test-"));
const dbPath = path.join(tempDir, "seed.db");

afterEach(() => {
  removeDbArtifacts(dbPath);
});

describe("seed script", () => {
  it("seeds 10,000 employees with full names from first/last name lists", () => {
    const db = new Database(dbPath);

    try {
      seedScript.ensureSchema(db);
      seedScript.seedEmployees(db, ["Alex"], ["Smith"]);

      const count = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
      expect(count.count).toBe(seedScript.TOTAL_EMPLOYEES);

      const sample = db
        .prepare("SELECT full_name as fullName, email FROM employees ORDER BY id ASC LIMIT 1")
        .get() as {
        fullName: string;
        email: string;
      };

      expect(sample.fullName).toBe("Alex Smith");
      expect(sample.email).toMatch(/alex\.smith\.0@org-example\.com/);
    } finally {
      db.close();
    }
  });

  it("uses deterministic random generator", () => {
    const randomA = seedScript.createRandom(123);
    const randomB = seedScript.createRandom(123);

    expect(randomA()).toBeCloseTo(randomB(), 10);
    expect(randomA()).toBeCloseTo(randomB(), 10);
    expect(randomA()).toBeCloseTo(randomB(), 10);
  });
});
