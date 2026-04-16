import { proxyToRails } from "@/lib/rails-api";

export async function GET(request: Request): Promise<Response> {
  return proxyToRails(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxyToRails(request);
}
