import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export type RadicoinPack = { id: string; name: string; coins: number; amountRials: number };
export type RadicoinPackOrder = RadicoinPack & {
  id: string;
  packId: string;
  status: "pending" | "paid" | "failed" | "canceled";
  refId: string | null;
  createdAt: string;
  paidAt: string | null;
};

export const radicoinPackKeys = {
  catalog: ["billing", "radicoin-packs"] as const,
  orders: ["billing", "radicoin-packs", "orders"] as const,
};

export function useRadicoinPacks() {
  return useQuery({
    queryKey: radicoinPackKeys.catalog,
    queryFn: () => apiRequest<RadicoinPack[]>("/api/billing/radicoin-packs"),
    staleTime: 5 * 60_000,
  });
}

export function useRadicoinPackOrders() {
  return useQuery({
    queryKey: radicoinPackKeys.orders,
    queryFn: () => apiRequest<RadicoinPackOrder[]>("/api/billing/radicoin-packs/orders"),
    staleTime: 30_000,
  });
}

export function useCreateRadicoinPackOrder() {
  return useMutation({
    mutationFn: (input: { packId: string; idempotencyKey: string }) =>
      apiRequest<{ checkout: "gateway" | "activated"; orderId: string; paymentUrl?: string }>(
        "/api/billing/radicoin-packs/orders",
        { method: "POST", body: JSON.stringify(input) },
      ),
  });
}
