export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Intern";

export type EmployeeStatus = "Active" | "On Leave" | "Resigned";

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string;
}

export interface EmployeeListFilters {
  search?: string;
  country?: string;
  jobTitle?: string;
  page: number;
  pageSize: number;
}

export interface PagedEmployees {
  data: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CountrySalaryInsights {
  country: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
  medianSalary: number;
  p90Salary: number;
  totalPayroll: number;
  topJobTitles: Array<{
    jobTitle: string;
    headcount: number;
    averageSalary: number;
  }>;
  employmentTypeDistribution: Array<{
    employmentType: EmploymentType;
    count: number;
  }>;
}

export interface JobTitleSalaryInsights {
  country: string;
  jobTitle: string;
  headcount: number;
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
}
