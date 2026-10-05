"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api-client";
import { buildQueryString } from "./build-query-string";

export type RadicoinTransaction = {
  id: string;
  orderId: string | null;
  source: string;
  bucket: "earned" | "promotional";
  status: "pending" | "available" | "reversed" | "expired";
  amount: number;
  description: string;
  expiresAt: string | null;
  createdAt: string;
};
export type RadicoinWallet = {
  wallet: {
    userId: string;
    availableCoins: number;
    pendingCoins: number;
    lifetimeEarnedCoins: number;
    lifetimeSpentCoins: number;
  } | null;
  transactions: RadicoinTransaction[];
};
export type RadicoinSettings = {
  dailyLoginCoins: number;
  dailyActivityCoinCap: number;
  activityCoins: number;
  referrerSignupCoins: number;
  referredSignupCoins: number;
  referrerActivationCoins: number;
  referredActivationCoins: number;
  referrerUpgradeCoins: number;
  purchaserCoins: number;
};
export type RadicoinAdminSettings = {
  settings: RadicoinSettings;
  plans: Array<{ id: string; name: string; radicoinCost: number | null; isActive: boolean }>;
};
export type AdminWalletItem = {
  user: { id: string; fullName: string | null; phone: string | null; email: string | null };
  wallet: {
    availableCoins: number;
    pendingCoins: number;
    lifetimeEarnedCoins: number;
    lifetimeSpentCoins: number;
  } | null;
};

export const radicoinKeys = {
  wallet: ["radicoin", "wallet"] as const,
  settings: ["admin", "radicoin", "settings"] as const,
  wallets: (search: string, page: number, pageSize: number) =>
    ["admin", "radicoin", "wallets", search, page, pageSize] as const,
};
export function useRadicoinWallet(enabled = true) {
  return useQuery({
    queryKey: radicoinKeys.wallet,
    queryFn: () => apiRequest<RadicoinWallet>("/api/radicoin/wallet?limit=100"),
    enabled,
    staleTime: 30_000,
  });
}
export function useRedeemRadicoinPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiRequest<{ planName: string; spentCoins: number }>("/api/billing/radicoin/redeem", {
        method: "POST",
        body: JSON.stringify({ planId, idempotencyKey: crypto.randomUUID() }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: radicoinKeys.wallet }),
        client.invalidateQueries({ queryKey: ["billing", "membership"] }),
      ]);
    },
  });
}
export function useRadicoinAdminSettings() {
  return useQuery({
    queryKey: radicoinKeys.settings,
    queryFn: () => apiRequest<RadicoinAdminSettings>("/api/admin/radicoin/settings"),
    staleTime: 30_000,
  });
}
export function useUpdateRadicoinSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RadicoinSettings & { planCosts: Array<{ id: string; radicoinCost: number | null }> }) =>
      apiRequest("/api/admin/radicoin/settings", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: radicoinKeys.settings }),
  });
}
export function useAdminRadicoinWallets(search: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: radicoinKeys.wallets(search, page, pageSize),
    queryFn: () =>
      apiRequest<{ items: AdminWalletItem[]; total: number }>(
        `/api/admin/radicoin/wallets?${buildQueryString({ search, page, pageSize })}`,
      ),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });
}
export function useGrantPromotionalRadicoins() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...input }: { userId: string; amount: number; description: string; expiresAt?: string }) =>
      apiRequest(`/api/admin/radicoin/wallets/${userId}/promotional`, {
        method: "POST",
        body: JSON.stringify({ ...input, idempotencyKey: crypto.randomUUID() }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "radicoin", "wallets"] }),
  });
}
export function useAdjustRadicoins() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...input }: { userId: string; amount: number; description: string }) =>
      apiRequest(`/api/admin/radicoin/wallets/${userId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ ...input, idempotencyKey: crypto.randomUUID() }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "radicoin", "wallets"] }),
  });
}
