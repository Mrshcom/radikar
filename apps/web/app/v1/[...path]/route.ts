import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/api-proxy";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyApiRequest(request, "v1", path);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
