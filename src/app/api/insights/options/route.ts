import { NextResponse } from "next/server";
import { listCountries, listJobTitles } from "@/lib/employee-repository";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const country = url.searchParams.get("country") ?? undefined;

    return NextResponse.json({
      countries: listCountries(),
      jobTitles: listJobTitles(country),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
