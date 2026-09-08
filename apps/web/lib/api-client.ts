import { apiUrl } from "./api-url";
import { toPersianServiceErrorMessage } from "./service-error-message";

export { toPersianServiceErrorMessage } from "./service-error-message";

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
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const networkErrorMessage =
  "ارتباط با سرویس برقرار نشد. لطفاً اتصال شبکه را بررسی و دوباره تلاش کنید.";

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
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: "include",
      headers: {
        ...(hasJsonBody ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw error;
    throw new ApiError(0, toPersianServiceErrorMessage(error, networkErrorMessage));
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    const message = toPersianServiceErrorMessage(body.error);
    if (response.status === 402) notifyPlanUpgradeRequired(message);
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      response.status,
      toPersianServiceErrorMessage(
        error,
        "پاسخ دریافتی از سرویس معتبر نبود. لطفاً دوباره تلاش کنید.",
      ),
    );
  }
}
