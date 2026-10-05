"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  byModel: Array<ModelUsageTotals & { provider: string; model: string }>;
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
      user: { phone: string | null; email: string | null; fullName: string | null };
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
  user: { id: string; phone: string | null; email: string | null; fullName: string | null };
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
export const adminAiSettingsQueryKey = ["admin", "ai-settings"] as const;
export const adminJobPoolQueryKey = ["admin", "job-pool"] as const;

export type AdminAiSettings = {
  current: { provider: "freeDeepseekAPI" | "gapgpt"; model: string; configured: boolean; dollarRateRials: number };
  providers: Array<{
    id: "freeDeepseekAPI" | "gapgpt";
    label: string;
    defaultModel: string;
    models?: Array<{ id: string; inputPrice: number; outputPrice: number }>;
  }>;
};

export type AdminJobPool = {
  settings: {
    enabled: boolean;
    dailyLimit: number;
    intervalHours: number;
    publishedAt: "r86400" | "r604800" | "r2592000";
    locations: string[];
  };
  activeJobCount: number;
  activeSegmentCount: number;
  latestRun: {
    status: "running" | "completed" | "failed";
    receivedCount: number;
    insertedCount: number;
    updatedCount: number;
    startedAt: string;
  } | null;
};

export type AdminJobPoolReport = {
  periodDays: number;
  totals: {
    runs: number;
    searches: number;
    received: number;
    inserted: number;
    updated: number;
    estimatedCostUsdMicros: number;
    successfulRuns: number;
    failedRuns: number;
    activeJobs: number;
  };
  runs: Array<{
    id: string;
    source: string;
    status: "running" | "completed" | "failed";
    requestedLimit: number;
    searchCount: number;
    receivedCount: number;
    insertedCount: number;
    updatedCount: number;
    estimatedCostUsdMicros: number;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string | null;
  }>;
};

export type AdminJobPoolListing = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  canonicalUrl: string;
  workplaceType: string | null;
  employmentType: string | null;
  seniority: string | null;
  salaryText: string | null;
  salaryPeriod: "monthly" | "yearly" | "unknown";
  salaryCurrency: string | null;
  postedAt: string | null;
  lastSeenAt: string;
  rawPayload: Record<string, unknown>;
};

export function useAdminJobPoolSettings(enabled: boolean) {
  return useQuery({
    queryKey: adminJobPoolQueryKey,
    queryFn: () => apiRequest<AdminJobPool>("/api/admin/job-pool"),
    enabled,
    staleTime: 30_000,
  });
}

export function useUpdateAdminJobPoolSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminJobPool["settings"]) =>
      apiRequest<AdminJobPool["settings"]>("/api/admin/job-pool/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData<AdminJobPool>(adminJobPoolQueryKey, (previous) =>
        previous ? { ...previous, settings } : previous,
      );
    },
  });
}

export function useRunAdminJobPoolSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{
        runId: string;
        receivedCount: number;
        insertedCount: number;
        updatedCount: number;
      }>("/api/admin/job-pool/sync", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminJobPoolQueryKey }),
  });
}

export function useAdminJobPoolReport(enabled: boolean, days: number) {
  return useQuery({
    queryKey: [...adminJobPoolQueryKey, "report", days],
    queryFn: () => apiRequest<AdminJobPoolReport>(`/api/admin/job-pool/report?days=${days}`),
    enabled,
    staleTime: 30_000,
  });
}

export function useAdminJobPoolListings(
  enabled: boolean,
  filters: {
    query: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDirection?: string;
  },
) {
  const query = buildQueryString(filters);
  return useQuery({
    queryKey: [...adminJobPoolQueryKey, "jobs", filters],
    queryFn: () =>
      apiRequest<{ items: AdminJobPoolListing[]; total: number; page: number; pageSize: number }>(
        `/api/admin/job-pool/jobs?${query}`,
      ),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminAiSettings(enabled: boolean) {
  return useQuery({
    queryKey: adminAiSettingsQueryKey,
    queryFn: () => apiRequest<AdminAiSettings>("/api/admin/ai-settings"),
    enabled,
    staleTime: 30_000,
  });
}

export function useUpdateAdminAiSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: "freeDeepseekAPI" | "gapgpt"; model?: string; dollarRateRials?: number }) =>
      apiRequest<AdminAiSettings["current"]>("/api/admin/ai-settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (current) => {
      queryClient.setQueryData<AdminAiSettings>(adminAiSettingsQueryKey, (previous) =>
        previous ? { ...previous, current } : previous,
      );
    },
  });
}

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
  provider = "",
  sortBy = "",
  sortDirection = "",
) {
  return useQuery({
    queryKey: [...adminModelUsageQueryKey, days, page, pageSize, provider, sortBy, sortDirection],
    queryFn: () =>
      apiRequest<AdminModelUsageStats>(
        `/api/admin/model-usage?${buildQueryString({ days, page, pageSize, provider, sortBy, sortDirection })}`,
      ),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
    placeholderData: keepPreviousData,
  });
}
