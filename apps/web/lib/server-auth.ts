import "server-only";

import { cookies } from "next/headers";

export type ServerAuthUser = {
  id: string;
  role: "user" | "admin" | "superadmin";
};

export async function getServerAuthUser(): Promise<ServerAuthUser | null> {
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has("radikar_session") ||
    cookieStore.has("__Host-radikar_session");
  if (!hasSessionCookie) return null;

  const apiOrigin = (
    process.env.API_PROXY_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL
  )?.replace(/\/+$/, "");
  if (!apiOrigin) return null;

  try {
    const response = await fetch(`${apiOrigin}/api/auth/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = (await response.json()) as { user?: ServerAuthUser };
    return result.user ?? null;
  } catch {
    return null;
  }
}
