import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getJobTitleSalaryInsights } from "@/lib/insights-service";
import { jobTitleInsightsQuerySchema } from "@/lib/validation";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const query = jobTitleInsightsQuerySchema.parse({
      country: url.searchParams.get("country") ?? undefined,
      jobTitle: url.searchParams.get("jobTitle") ?? undefined,
    });

    const insights = getJobTitleSalaryInsights(query.country, query.jobTitle);

    if (!insights) {
      return NextResponse.json(
        { error: "No employees found for this job title in the given country" },
        { status: 404 },
      );
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

    return NextResponse.json({ error: "Failed to fetch job title insights" }, { status: 500 });
  }
}
