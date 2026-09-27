import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export type ReferralDashboard = {
  code: string;
  visits: number;
  pendingReferrals: number;
  confirmedReferrals: number;
  confirmedPoints: number;
  events: Array<{
    id: string;
    points: number;
    status: "pending" | "confirmed" | "revoked";
    description: string;
    createdAt: string;
  }>;
};

export type ReferralSettings = {
  isActive: boolean;
  referrerPoints: number;
  referredPoints: number;
};

export const referralDashboardQueryKey = ["referrals", "me"] as const;
export const referralLeaderboardQueryKey = ["referrals", "leaderboard"] as const;
export const referralSettingsQueryKey = ["admin", "referrals", "settings"] as const;

export function useReferralDashboard() {
  return useQuery({
    queryKey: referralDashboardQueryKey,
    queryFn: () => apiRequest<{ referral: ReferralDashboard }>("/api/referrals/me"),
    staleTime: 30_000,
  });
}

export function useReferralLeaderboard() {
  return useQuery({
    queryKey: referralLeaderboardQueryKey,
    queryFn: () => apiRequest<{ items: Array<{ userId: string; displayName: string; referrals: number }> }>("/api/referrals/leaderboard"),
    staleTime: 60_000,
  });
}

export function recordReferralVisit(code: string) {
  return apiRequest<void>("/api/referrals/visits", { method: "POST", body: JSON.stringify({ code }) });
}

export function useReferralSettings() {
  return useQuery({
    queryKey: referralSettingsQueryKey,
    queryFn: () => apiRequest<{ settings: ReferralSettings }>("/api/admin/referrals/settings"),
    staleTime: 30_000,
  });
}

export function useUpdateReferralSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: ReferralSettings) => apiRequest<{ settings: ReferralSettings }>("/api/admin/referrals/settings", { method: "PATCH", body: JSON.stringify(settings) }),
    onSuccess: (response) => queryClient.setQueryData(referralSettingsQueryKey, response),
  });
}

export type AdminReferral = {
  id: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  confirmedAt: string | null;
  referrer: { id: string; fullName: string | null; phone: string | null; email: string | null };
  referred: { id: string; fullName: string | null; phone: string | null; email: string | null };
};

export function useAdminReferrals(page: number, pageSize: number) {
  return useQuery({
    queryKey: ["admin", "referrals", page, pageSize],
    queryFn: () => apiRequest<{ items: AdminReferral[]; total: number }>(`/api/admin/referrals?page=${page}&pageSize=${pageSize}`),
    staleTime: 20_000,
  });
}

export function useAdjustReferralPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, points, description }: { userId: string; points: number; description: string }) => apiRequest(`/api/admin/referrals/users/${userId}/adjust`, { method: "POST", body: JSON.stringify({ points, description }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] }),
  });
}
