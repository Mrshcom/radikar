"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api-client";
import { buildQueryString } from "./build-query-string";

export type Plan = {
  id: string;
  name: string;
  description: string;
  priceRials: number;
  durationDays: number;
  resumeLimit: number | null;
  pdfDownloadLimit: number | null;
  aiCredits: number;
  matchCredits: number;
  interviewCredits: number;
  isFree: boolean;
  isPurchasable: boolean;
  sortOrder: number;
};

export type Membership = {
  id: string;
  planId: string;
  status: "active" | "canceled" | "expired";
  startsAt: string;
  expiresAt: string;
  resumesRemaining: number | null;
  pdfDownloadsRemaining: number | null;
  aiCreditsRemaining: number;
  matchCreditsRemaining: number;
  interviewCreditsRemaining: number;
  plan: Plan;
  usage: Record<
    "resume" | "pdf" | "ai" | "match" | "interview",
    { used: number; remaining: number | null; total: number | null }
  >;
};

export type Order = {
  id: string;
  orderNumber: string;
  amountRials: number;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  gateway: string;
  refId: string | null;
  failureMessage: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type OrdersResponse = {
  items: Array<{ order: Order; plan: Plan }>;
  total: number;
  page: number;
  pageSize: number;
};

export const billingKeys = {
  plans: ["billing", "plans"] as const,
  membership: ["billing", "membership"] as const,
  orders: (page: number, pageSize: number, search: string, status: string) =>
    ["billing", "orders", page, pageSize, search, status] as const,
};

export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: () => apiRequest<Plan[]>("/api/billing/plans"),
    staleTime: 5 * 60_000,
  });
}

export function useMembership() {
  return useQuery({
    queryKey: billingKeys.membership,
    queryFn: () => apiRequest<Membership>("/api/billing/membership"),
    staleTime: 30_000,
  });
}

export function useOrders(page = 1, pageSize = 20, search = "", status = "") {
  return useQuery({
    queryKey: billingKeys.orders(page, pageSize, search, status),
    queryFn: () => apiRequest<OrdersResponse>(
      `/api/billing/orders?${buildQueryString({ page, pageSize, search, status })}`,
    ),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiRequest<{ orderId: string; orderNumber: string; paymentUrl: string }>(
        "/api/billing/orders",
        { method: "POST", body: JSON.stringify({ planId }) },
      ),
    onSuccess: async ({ paymentUrl }) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "orders"] });
      window.location.assign(paymentUrl);
    },
  });
}

export function formatTomans(priceRials: number) {
  return (priceRials / 10).toLocaleString("fa-IR");
}

export function formatLimit(value: number | null) {
  return value === null ? "نامحدود" : value.toLocaleString("fa-IR");
}
