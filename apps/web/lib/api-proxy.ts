import { NextRequest } from "next/server";

const apiOrigin = process.env.API_PROXY_ORIGIN?.replace(/\/+$/, "");

export async function proxyApiRequest(
  request: NextRequest,
  pathPrefix: string,
  path: string[],
) {
  if (!apiOrigin) return Response.json({ error: "API proxy is not configured." }, { status: 503 });

  const target = `${apiOrigin}/${pathPrefix}/${path.join("/")}${request.nextUrl.search}`;
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
