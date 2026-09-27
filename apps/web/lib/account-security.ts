import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export type AccountSession = {
  id: string;
  current: boolean;
  status: "active" | "logged_out" | "expired";
  loginIp: string | null;
  logoutIp: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  endedAt: string | null;
};

export const accountSessionsQueryKey = ["account", "sessions"] as const;

export function useAccountSessions(enabled: boolean) {
  return useQuery({
    queryKey: accountSessionsQueryKey,
    queryFn: () => apiRequest<{ sessions: AccountSession[] }>("/api/account/sessions"),
    enabled,
    staleTime: 30_000,
  });
}

export function useRevokeAccountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest<void>(`/api/account/sessions/${sessionId}/revoke`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountSessionsQueryKey }),
  });
}
