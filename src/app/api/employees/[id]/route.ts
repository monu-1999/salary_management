import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/lib/employee-repository";
import { employeeInputSchema } from "@/lib/validation";

function parseId(id: string): number | null {
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return null;
  }

  return numericId;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  const employee = getEmployeeById(id);

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json(employee);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
    }

    const payload = await request.json();
    const employeeInput = employeeInputSchema.parse(payload);
    const employee = updateEmployee(id, employeeInput);

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: employees.email")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  const deleted = deleteEmployee(id);

  if (!deleted) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
