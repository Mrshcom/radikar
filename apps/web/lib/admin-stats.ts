"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UserRole } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";

export type AdminStats = {
  users: {
    total: number;
    active: number;
    registeredToday: number;
    activeToday: number;
  };
  records: {
    total: number;
    resumes: number;
    resumesToday: number;
    byCollection: { collection: string; total: number }[];
  };
  usersByRole: { role: UserRole; total: number }[];
};

export type AdminBillingStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  revenueRials: number;
  ordersToday: number;
  paidOrdersToday: number;
  revenueTodayRials: number;
};

type ModelUsageTotals = {
  requests: number;
  successfulRequests: number;
  failedRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostMicros: number;
};

export type AdminModelUsageStats = {
  periodDays: number;
  totals: ModelUsageTotals & {
    providerReportedRequests: number;
    estimatedRequests: number;
    averageDurationMs: number;
  };
  today: ModelUsageTotals;
  byModel: Array<
    ModelUsageTotals & { provider: string; model: string }
  >;
  byOperation: Array<ModelUsageTotals & { operation: string }>;
  daily: Array<ModelUsageTotals & { date: string }>;
  recentRequests: {
    items: Array<{
      id: string;
      operation: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCostMicros: number;
      successful: boolean;
      createdAt: string;
      user: { phone: string; fullName: string | null };
    }>;
    total: number;
    page: number;
    pageSize: number;
  };
};

export type AdminEvent = {
  id: string;
  type: "signup" | "login" | "purchase" | "resume";
  createdAt: string;
  user: { id: string; phone: string; fullName: string | null };
  details: {
    orderId?: string;
    planName?: string;
    amountRials?: number;
    refId?: string | null;
    recordId?: string;
    profileId?: string | null;
  };
};

export const adminStatsQueryKey = ["admin", "stats"] as const;
export const adminBillingStatsQueryKey = ["admin", "billing-stats"] as const;
export const adminEventsQueryKey = ["admin", "events"] as const;
export const adminModelUsageQueryKey = ["admin", "model-usage"] as const;

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: adminStatsQueryKey,
    queryFn: () => apiRequest<AdminStats>("/api/admin/stats"),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useAdminBillingStats(enabled: boolean) {
  return useQuery({
    queryKey: adminBillingStatsQueryKey,
    queryFn: () => apiRequest<AdminBillingStats>("/api/admin/billing-stats"),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useAdminEvents(enabled: boolean) {
  return useQuery({
    queryKey: adminEventsQueryKey,
    queryFn: () => apiRequest<{ items: AdminEvent[] }>("/api/admin/events?limit=30"),
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? 15_000 : false,
  });
}

export function useAdminModelUsage(
  enabled: boolean,
  days = 30,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: [...adminModelUsageQueryKey, days, page, pageSize],
    queryFn: () =>
      apiRequest<AdminModelUsageStats>(
        `/api/admin/model-usage?${buildQueryString({ days, page, pageSize })}`,
      ),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
    placeholderData: keepPreviousData,
  });
}
