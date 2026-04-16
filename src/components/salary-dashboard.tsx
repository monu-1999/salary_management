"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/components/salary-dashboard.module.css";
import type {
  CountrySalaryInsights,
  Employee,
  EmployeeInput,
  JobTitleSalaryInsights,
  PagedEmployees,
} from "@/lib/employee-types";

const PAGE_SIZE = 20;

const EMPTY_FORM: EmployeeInput = {
  fullName: "",
  email: "",
  jobTitle: "",
  department: "",
  country: "",
  salary: 60000,
  currency: "USD",
  employmentType: "Full-time",
  status: "Active",
  hireDate: new Date().toISOString().slice(0, 10),
};

interface OptionsResponse {
  countries: string[];
  jobTitles: string[];
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Request failed";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      value,
    )}`;
  }
}

function toPayload(form: EmployeeInput): EmployeeInput {
  return {
    ...form,
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    jobTitle: form.jobTitle.trim(),
    department: form.department.trim(),
    country: form.country.trim(),
    currency: form.currency.trim().toUpperCase(),
    hireDate: form.hireDate,
    salary: Number(form.salary),
  };
}

export default function SalaryDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [jobTitleFilter, setJobTitleFilter] = useState("");

  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [jobTitleOptions, setJobTitleOptions] = useState<string[]>([]);

  const [insightCountry, setInsightCountry] = useState("");
  const [insightJobTitle, setInsightJobTitle] = useState("");
  const [insightJobTitleOptions, setInsightJobTitleOptions] = useState<string[]>([]);
  const [countryInsights, setCountryInsights] = useState<CountrySalaryInsights | null>(null);
  const [jobTitleInsights, setJobTitleInsights] = useState<JobTitleSalaryInsights | null>(null);

  const [form, setForm] = useState<EmployeeInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedInsightCurrency = countryInsights?.currency ?? jobTitleInsights?.currency ?? "USD";

  const totalLabel = useMemo(
    () => new Intl.NumberFormat("en-US").format(pagination.total),
    [pagination.total],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPagination((current) => ({ ...current, page: 1 }));
      setSearchFilter(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const query = buildQuery({ country: countryFilter || undefined });
        const response = await fetchJson<OptionsResponse>(
          query ? `/api/insights/options?${query}` : "/api/insights/options",
        );
        setCountryOptions(response.countries);
        setJobTitleOptions(response.jobTitles);

        if (countryFilter && !response.countries.includes(countryFilter)) {
          setCountryFilter("");
        }

        if (jobTitleFilter && !response.jobTitles.includes(jobTitleFilter)) {
          setJobTitleFilter("");
        }

        if (!insightCountry && response.countries.length > 0) {
          setInsightCountry(response.countries[0]);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load filters");
      }
    }

    void loadFilterOptions();
  }, [countryFilter, jobTitleFilter, insightCountry]);

  useEffect(() => {
    async function loadEmployees() {
      setIsLoading(true);

      try {
        const query = buildQuery({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: searchFilter || undefined,
          country: countryFilter || undefined,
          jobTitle: jobTitleFilter || undefined,
        });

        const response = await fetchJson<PagedEmployees>(`/api/employees?${query}`);
        setEmployees(response.data);
        setPagination(response.pagination);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    }

    void loadEmployees();
  }, [pagination.page, pagination.pageSize, searchFilter, countryFilter, jobTitleFilter]);

  useEffect(() => {
    async function loadInsightJobTitles() {
      if (!insightCountry) {
        setInsightJobTitleOptions([]);
        return;
      }

      try {
        const query = buildQuery({ country: insightCountry });
        const response = await fetchJson<OptionsResponse>(`/api/insights/options?${query}`);
        setInsightJobTitleOptions(response.jobTitles);

        if (!insightJobTitle && response.jobTitles.length > 0) {
          setInsightJobTitle(response.jobTitles[0]);
        }

        if (insightJobTitle && !response.jobTitles.includes(insightJobTitle)) {
          setInsightJobTitle(response.jobTitles[0] ?? "");
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load insight options");
      }
    }

    void loadInsightJobTitles();
  }, [insightCountry, insightJobTitle]);

  useEffect(() => {
    async function loadCountryInsights() {
      if (!insightCountry) {
        setCountryInsights(null);
        return;
      }

      try {
        const query = buildQuery({ country: insightCountry });
        const response = await fetchJson<CountrySalaryInsights>(`/api/insights/country?${query}`);
        setCountryInsights(response);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 404) {
          setCountryInsights(null);
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load country insights");
      }
    }

    void loadCountryInsights();
  }, [insightCountry]);

  useEffect(() => {
    async function loadJobTitleInsights() {
      if (!insightCountry || !insightJobTitle) {
        setJobTitleInsights(null);
        return;
      }

      try {
        const query = buildQuery({ country: insightCountry, jobTitle: insightJobTitle });
        const response = await fetchJson<JobTitleSalaryInsights>(
          `/api/insights/job-title?${query}`,
        );
        setJobTitleInsights(response);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 404) {
          setJobTitleInsights(null);
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load job title insights");
      }
    }

    void loadJobTitleInsights();
  }, [insightCountry, insightJobTitle]);

  async function refreshEmployeesToFirstPage(): Promise<void> {
    setPagination((current) => ({ ...current, page: 1 }));
    const query = buildQuery({
      page: 1,
      pageSize: pagination.pageSize,
      search: searchFilter || undefined,
      country: countryFilter || undefined,
      jobTitle: jobTitleFilter || undefined,
    });
    const response = await fetchJson<PagedEmployees>(`/api/employees?${query}`);
    setEmployees(response.data);
    setPagination(response.pagination);
  }

  function resetForm(): void {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(employee: Employee): void {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      jobTitle: employee.jobTitle,
      department: employee.department,
      country: employee.country,
      salary: employee.salary,
      currency: employee.currency,
      employmentType: employee.employmentType,
      status: employee.status,
      hireDate: employee.hireDate,
    });
    setMessage(`Editing ${employee.fullName}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = toPayload(form);

      if (editingId) {
        await fetchJson<Employee>(`/api/employees/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Employee updated successfully");
      } else {
        await fetchJson<Employee>("/api/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Employee created successfully");
      }

      resetForm();
      await refreshEmployeesToFirstPage();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(employee: Employee): Promise<void> {
    const shouldDelete = window.confirm(`Delete ${employee.fullName}?`);
    if (!shouldDelete) {
      return;
    }

    setError(null);

    try {
      await fetchJson<null>(`/api/employees/${employee.id}`, { method: "DELETE" });
      setMessage("Employee deleted successfully");

      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee(null);
      }

      if (employees.length === 1 && pagination.page > 1) {
        setPagination((current) => ({ ...current, page: current.page - 1 }));
      } else {
        await refreshEmployeesToFirstPage();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete employee");
    }
  }

  function updateForm<Field extends keyof EmployeeInput>(field: Field, value: EmployeeInput[Field]): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className={styles.page}>
      <div className={styles.backdropPattern} />

      <section className={styles.hero}>
        <p className={styles.kicker}>HR Salary Operations</p>
        <h1 className={styles.title}>Salary Management Workspace</h1>
        <p className={styles.subtitle}>
          Manage {totalLabel} employees with country-level salary intelligence and role-based
          benchmarking.
        </p>
      </section>

      {error ? <p className={styles.alertError}>{error}</p> : null}
      {message ? <p className={styles.alertSuccess}>{message}</p> : null}

      <section className={styles.grid}>
        <article className={`${styles.card} ${styles.spanTwo}`}>
          <header className={styles.cardHeader}>
            <h2>Employees</h2>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                resetForm();
                setMessage("Ready to add a new employee");
              }}
            >
              Add Employee
            </button>
          </header>

          <div className={styles.filters}>
            <label>
              Search
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email, department, title"
              />
            </label>

            <label>
              Country
              <select
                value={countryFilter}
                onChange={(event) => {
                  setCountryFilter(event.target.value);
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
              >
                <option value="">All Countries</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Job Title
              <select
                value={jobTitleFilter}
                onChange={(event) => {
                  setJobTitleFilter(event.target.value);
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
              >
                <option value="">All Job Titles</option>
                {jobTitleOptions.map((jobTitle) => (
                  <option key={jobTitle} value={jobTitle}>
                    {jobTitle}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>Country</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      No employees match your filters.
                    </td>
                  </tr>
                ) : null}

                {isLoading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      Loading employees...
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.fullName}</td>
                        <td>{employee.jobTitle}</td>
                        <td>{employee.country}</td>
                        <td>{formatMoney(employee.salary, employee.currency)}</td>
                        <td>{employee.status}</td>
                        <td>
                          <div className={styles.actions}>
                            <button type="button" onClick={() => setSelectedEmployee(employee)}>
                              View
                            </button>
                            <button type="button" onClick={() => startEditing(employee)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className={styles.deleteButton}
                              onClick={() => {
                                void handleDelete(employee);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <footer className={styles.pagination}>
            <span>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <div>
              <button
                type="button"
                onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                disabled={pagination.page <= 1 || isLoading}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                disabled={
                  isLoading ||
                  pagination.totalPages === 0 ||
                  pagination.page >= Math.max(1, pagination.totalPages)
                }
              >
                Next
              </button>
            </div>
          </footer>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>{editingId ? "Update Employee" : "Add Employee"}</h2>
            {editingId ? (
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </header>

          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Full Name
              <input
                required
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.target.value)}
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
              />
            </label>

            <label>
              Job Title
              <input
                required
                value={form.jobTitle}
                onChange={(event) => updateForm("jobTitle", event.target.value)}
              />
            </label>

            <label>
              Department
              <input
                required
                value={form.department}
                onChange={(event) => updateForm("department", event.target.value)}
              />
            </label>

            <label>
              Country
              <input
                list="country-options"
                required
                value={form.country}
                onChange={(event) => updateForm("country", event.target.value)}
              />
            </label>

            <datalist id="country-options">
              {countryOptions.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>

            <label>
              Salary
              <input
                required
                min={1}
                type="number"
                value={form.salary}
                onChange={(event) => updateForm("salary", Number(event.target.value))}
              />
            </label>

            <label>
              Currency
              <input
                required
                maxLength={3}
                value={form.currency}
                onChange={(event) => updateForm("currency", event.target.value.toUpperCase())}
              />
            </label>

            <label>
              Employment Type
              <select
                value={form.employmentType}
                onChange={(event) =>
                  updateForm("employmentType", event.target.value as EmployeeInput["employmentType"])
                }
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value as EmployeeInput["status"])}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Resigned">Resigned</option>
              </select>
            </label>

            <label>
              Hire Date
              <input
                required
                type="date"
                value={form.hireDate}
                onChange={(event) => updateForm("hireDate", event.target.value)}
              />
            </label>

            <button className={styles.primaryButton} type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Employee" : "Create Employee"}
            </button>
          </form>
        </article>

        <article className={`${styles.card} ${styles.spanTwo}`}>
          <header className={styles.cardHeader}>
            <h2>Salary Insights</h2>
          </header>

          <div className={styles.insightFilters}>
            <label>
              Country
              <select
                value={insightCountry}
                onChange={(event) => setInsightCountry(event.target.value)}
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Job Title
              <select
                value={insightJobTitle}
                onChange={(event) => setInsightJobTitle(event.target.value)}
              >
                {insightJobTitleOptions.map((jobTitle) => (
                  <option key={jobTitle} value={jobTitle}>
                    {jobTitle}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {countryInsights ? (
            <div className={styles.metricsGrid}>
              <div>
                <p>Headcount</p>
                <strong>{new Intl.NumberFormat("en-US").format(countryInsights.headcount)}</strong>
              </div>
              <div>
                <p>Average Salary</p>
                <strong>
                  {formatMoney(countryInsights.averageSalary, selectedInsightCurrency)}
                </strong>
              </div>
              <div>
                <p>Median Salary</p>
                <strong>{formatMoney(countryInsights.medianSalary, selectedInsightCurrency)}</strong>
              </div>
              <div>
                <p>P90 Salary</p>
                <strong>{formatMoney(countryInsights.p90Salary, selectedInsightCurrency)}</strong>
              </div>
              <div>
                <p>Minimum Salary</p>
                <strong>{formatMoney(countryInsights.minSalary, selectedInsightCurrency)}</strong>
              </div>
              <div>
                <p>Maximum Salary</p>
                <strong>{formatMoney(countryInsights.maxSalary, selectedInsightCurrency)}</strong>
              </div>
              <div>
                <p>Total Payroll</p>
                <strong>{formatMoney(countryInsights.totalPayroll, selectedInsightCurrency)}</strong>
              </div>
            </div>
          ) : (
            <p className={styles.emptyState}>No salary data available for this country.</p>
          )}

          {jobTitleInsights ? (
            <div className={styles.jobInsightCard}>
              <h3>
                {jobTitleInsights.jobTitle} in {jobTitleInsights.country}
              </h3>
              <p>
                Average: {formatMoney(jobTitleInsights.averageSalary, jobTitleInsights.currency)} |
                Min: {formatMoney(jobTitleInsights.minSalary, jobTitleInsights.currency)} | Max: {" "}
                {formatMoney(jobTitleInsights.maxSalary, jobTitleInsights.currency)} | Employees: {" "}
                {new Intl.NumberFormat("en-US").format(jobTitleInsights.headcount)}
              </p>
            </div>
          ) : (
            <p className={styles.emptyState}>No role-specific salary data available for this selection.</p>
          )}

          <div className={styles.insightDetailsGrid}>
            <section>
              <h3>Top Job Titles by Headcount</h3>
              <ul>
                {countryInsights?.topJobTitles.map((job) => (
                  <li key={job.jobTitle}>
                    <span>{job.jobTitle}</span>
                    <strong>
                      {job.headcount} employees · {formatMoney(job.averageSalary, selectedInsightCurrency)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Employment Type Distribution</h3>
              <ul>
                {countryInsights?.employmentTypeDistribution.map((entry) => (
                  <li key={entry.employmentType}>
                    <span>{entry.employmentType}</span>
                    <strong>{entry.count}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>Employee Snapshot</h2>
          </header>

          {selectedEmployee ? (
            <dl className={styles.detailList}>
              <div>
                <dt>Name</dt>
                <dd>{selectedEmployee.fullName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedEmployee.email}</dd>
              </div>
              <div>
                <dt>Job</dt>
                <dd>
                  {selectedEmployee.jobTitle} ({selectedEmployee.department})
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{selectedEmployee.country}</dd>
              </div>
              <div>
                <dt>Salary</dt>
                <dd>{formatMoney(selectedEmployee.salary, selectedEmployee.currency)}</dd>
              </div>
              <div>
                <dt>Employment</dt>
                <dd>{selectedEmployee.employmentType}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedEmployee.status}</dd>
              </div>
              <div>
                <dt>Hire Date</dt>
                <dd>{selectedEmployee.hireDate}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.emptyState}>Choose an employee from the table to view details.</p>
          )}
        </article>
      </section>
    </main>
  );
}
