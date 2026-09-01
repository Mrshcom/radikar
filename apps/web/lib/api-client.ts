import { apiUrl } from "./api-url";

export const PLAN_UPGRADE_REQUIRED_EVENT = "radicar:plan-upgrade-required";

export type PlanUpgradeRequiredEventDetail = {
  message: string;
};

let pendingPlanUpgradeMessage: string | null = null;

export function getPendingPlanUpgradeMessage() {
  return pendingPlanUpgradeMessage;
}

export function clearPendingPlanUpgradeMessage() {
  pendingPlanUpgradeMessage = null;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function notifyPlanUpgradeRequired(message: string) {
  if (typeof window === "undefined") return;
  pendingPlanUpgradeMessage = message;
  window.dispatchEvent(
    new CustomEvent<PlanUpgradeRequiredEventDetail>(
      PLAN_UPGRADE_REQUIRED_EVENT,
      { detail: { message } },
    ),
  );
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
    const message = body.error || "ارتباط با سرویس ناموفق بود.";
    if (response.status === 402) notifyPlanUpgradeRequired(message);
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
