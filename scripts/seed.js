const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const TOTAL_EMPLOYEES = 10_000;
const ROOT_DIR = process.cwd();
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, "sqlite", "salary.db");
const FIRST_NAMES_PATH = path.join(ROOT_DIR, "data", "first_names.txt");
const LAST_NAMES_PATH = path.join(ROOT_DIR, "data", "last_names.txt");

const countries = [
  "United States",
  "India",
  "United Kingdom",
  "Germany",
  "Canada",
  "Singapore",
  "Australia",
  "United Arab Emirates",
  "Brazil",
  "Japan",
];

const countryCurrency = {
  "United States": "USD",
  India: "INR",
  "United Kingdom": "GBP",
  Germany: "EUR",
  Canada: "CAD",
  Singapore: "SGD",
  Australia: "AUD",
  "United Arab Emirates": "AED",
  Brazil: "BRL",
  Japan: "JPY",
};

const countryMultiplier = {
  "United States": 1,
  India: 0.42,
  "United Kingdom": 0.94,
  Germany: 0.91,
  Canada: 0.88,
  Singapore: 0.97,
  Australia: 0.9,
  "United Arab Emirates": 0.84,
  Brazil: 0.56,
  Japan: 0.92,
};

const jobProfiles = [
  { title: "Software Engineer", department: "Engineering", min: 85_000, max: 190_000 },
  { title: "Senior Software Engineer", department: "Engineering", min: 115_000, max: 240_000 },
  { title: "Engineering Manager", department: "Engineering", min: 130_000, max: 265_000 },
  { title: "Product Manager", department: "Product", min: 95_000, max: 210_000 },
  { title: "Data Analyst", department: "Analytics", min: 70_000, max: 150_000 },
  { title: "Data Scientist", department: "Analytics", min: 95_000, max: 200_000 },
  { title: "HR Manager", department: "People Operations", min: 75_000, max: 160_000 },
  { title: "Finance Manager", department: "Finance", min: 80_000, max: 170_000 },
  { title: "Marketing Specialist", department: "Marketing", min: 60_000, max: 135_000 },
  { title: "Sales Executive", department: "Sales", min: 65_000, max: 175_000 },
  { title: "Operations Analyst", department: "Operations", min: 62_000, max: 140_000 },
  { title: "Customer Success Manager", department: "Customer Success", min: 68_000, max: 150_000 },
];

const employmentTypes = [
  { value: "Full-time", weight: 70 },
  { value: "Contract", weight: 14 },
  { value: "Part-time", weight: 10 },
  { value: "Intern", weight: 6 },
];

const statuses = [
  { value: "Active", weight: 84 },
  { value: "On Leave", weight: 10 },
  { value: "Resigned", weight: 6 },
];

function createRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pickWeighted(values, random) {
  const total = values.reduce((sum, entry) => sum + entry.weight, 0);
  const threshold = random() * total;

  let running = 0;
  for (const entry of values) {
    running += entry.weight;
    if (threshold <= running) {
      return entry.value;
    }
  }

  return values[values.length - 1].value;
}

function readNameList(filePath) {
  const file = fs.readFileSync(filePath, "utf8");
  return file
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function ensureSchema(db) {
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
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
  `);
}

function randomDate(random, startYear, endYear) {
  const start = Date.UTC(startYear, 0, 1);
  const end = Date.UTC(endYear, 11, 31);
  const timestamp = start + Math.floor(random() * (end - start));
  return new Date(timestamp).toISOString().slice(0, 10);
}

function seedEmployees(db, firstNames, lastNames) {
  const random = createRandom(20260416);
  const now = new Date().toISOString();

  const insert = db.prepare(`
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const runSeed = db.transaction((employeeCount) => {
    db.prepare("DELETE FROM employees").run();

    for (let index = 0; index < employeeCount; index += 1) {
      const firstName = firstNames[Math.floor(random() * firstNames.length)];
      const lastName = lastNames[Math.floor(random() * lastNames.length)];
      const country = countries[Math.floor(random() * countries.length)];
      const profile = jobProfiles[Math.floor(random() * jobProfiles.length)];

      const baseSalary = profile.min + Math.floor(random() * (profile.max - profile.min + 1));
      const salary = Math.max(20_000, Math.round(baseSalary * countryMultiplier[country]));

      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName}.${lastName}.${index}@org-example.com`.toLowerCase();

      insert.run(
        fullName,
        email,
        profile.title,
        profile.department,
        country,
        salary,
        countryCurrency[country],
        pickWeighted(employmentTypes, random),
        pickWeighted(statuses, random),
        randomDate(random, 2014, 2026),
        now,
        now,
      );
    }
  });

  runSeed(TOTAL_EMPLOYEES);
}

function main() {
  const startTime = Date.now();

  if (!fs.existsSync(FIRST_NAMES_PATH) || !fs.existsSync(LAST_NAMES_PATH)) {
    throw new Error("first_names.txt and last_names.txt must exist in the data directory");
  }

  const firstNames = readNameList(FIRST_NAMES_PATH);
  const lastNames = readNameList(LAST_NAMES_PATH);

  if (firstNames.length === 0 || lastNames.length === 0) {
    throw new Error("Name lists cannot be empty");
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);

  try {
    ensureSchema(db);
    seedEmployees(db, firstNames, lastNames);

    const total = db.prepare("SELECT COUNT(*) as count FROM employees").get().count;
    const durationMs = Date.now() - startTime;

    console.log(`Seed completed. Employees inserted: ${total}. Duration: ${durationMs}ms`);
  } finally {
    db.close();
  }
}

main();
