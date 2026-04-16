import { proxyToRails } from "@/lib/rails-api";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  return proxyToRails(request, { pathnameOverride: `/api/employees/${encodeURIComponent(params.id)}` });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  return proxyToRails(request, { pathnameOverride: `/api/employees/${encodeURIComponent(params.id)}` });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  return proxyToRails(request, { pathnameOverride: `/api/employees/${encodeURIComponent(params.id)}` });
}
