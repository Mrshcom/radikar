"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api-client";
import { billingKeys } from "./billing";
import { radicoinKeys } from "./radicoins";

export type CreditPack = {
  id: string;
  name: string;
  amountRials: number;
  radicoinCost: number;
  interviewCredits: number;
  aiCredits: number;
};

export const creditPackKeys = { catalog: ["billing", "credit-packs"] as const };

export function useCreditPacks() {
  return useQuery({
    queryKey: creditPackKeys.catalog,
    queryFn: () => apiRequest<CreditPack[]>("/api/billing/credit-packs"),
    staleTime: 5 * 60_000,
  });
}

export function useBuyCreditPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { packId: string; paymentMethod: "gateway" | "radicoin"; idempotencyKey: string }) =>
      apiRequest<{ checkout: "gateway" | "activated"; orderId: string; paymentUrl?: string }>(
        "/api/billing/credit-packs/orders",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: async (result) => {
      if (result.checkout === "gateway" && result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingKeys.membership }),
        queryClient.invalidateQueries({ queryKey: radicoinKeys.wallet }),
      ]);
    },
  });
}
