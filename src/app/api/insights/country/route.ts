import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCountrySalaryInsights } from "@/lib/insights-service";
import { countryQuerySchema } from "@/lib/validation";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const query = countryQuerySchema.parse({
      country: url.searchParams.get("country") ?? undefined,
    });

    const insights = getCountrySalaryInsights(query.country);

    if (!insights) {
      return NextResponse.json({ error: "No employees found for this country" }, { status: 404 });
    }

    return NextResponse.json(insights);
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

    return NextResponse.json({ error: "Failed to fetch country insights" }, { status: 500 });
  }
}
