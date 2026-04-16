import { NextResponse } from "next/server";

const RAILS_API_BASE_URL = process.env.RAILS_API_BASE_URL ?? "http://127.0.0.1:3001";

function buildTargetUrl(request: Request, pathnameOverride?: string): string {
  const incoming = new URL(request.url);
  const target = new URL(pathnameOverride ?? incoming.pathname, RAILS_API_BASE_URL);
  target.search = incoming.search;
  return target.toString();
}

export async function proxyToRails(
  request: Request,
  options?: { pathnameOverride?: string },
): Promise<NextResponse> {
  try {
    const method = request.method.toUpperCase();
    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("content-type", contentType);
    }

    const canSendBody = method !== "GET" && method !== "HEAD";
    const body = canSendBody ? await request.text() : undefined;

    const response = await fetch(buildTargetUrl(request, options?.pathnameOverride), {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const payload = await response.text();
    const nextHeaders = new Headers();

    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      nextHeaders.set("content-type", responseContentType);
    }

    return new NextResponse(payload, {
      status: response.status,
      headers: nextHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Rails backend is unavailable" }, { status: 502 });
  }
}
