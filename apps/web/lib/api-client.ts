import { apiUrl } from "./api-url";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(hasJsonBody ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, body.error || "ارتباط با سرویس ناموفق بود.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
