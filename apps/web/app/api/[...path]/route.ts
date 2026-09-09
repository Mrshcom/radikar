import { NextRequest } from "next/server";

const apiOrigin = process.env.API_PROXY_ORIGIN?.replace(/\/+$/, "");

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!apiOrigin) return Response.json({ error: "API proxy is not configured." }, { status: 503 });

  const { path } = await context.params;
  const target = `${apiOrigin}/api/${path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
