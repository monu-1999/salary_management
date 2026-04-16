import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createEmployee, listEmployees } from "@/lib/employee-repository";
import { employeeInputSchema, employeeListQuerySchema } from "@/lib/validation";

function validationError(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      issues: error.issues,
    },
    { status: 400 },
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const parsedQuery = employeeListQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      country: url.searchParams.get("country") ?? undefined,
      jobTitle: url.searchParams.get("jobTitle") ?? undefined,
    });

    const result = listEmployees(parsedQuery);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = await request.json();
    const employeeInput = employeeInputSchema.parse(payload);
    const employee = createEmployee(employeeInput);

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: employees.email")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
