import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api-client";

export type UserNotification = {
  id: string;
  type: "interview_invitation";
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export type UserNotificationsResponse = {
  items: UserNotification[];
  unreadCount: number;
};

export const notificationKeys = { all: ["notifications"] as const };

export function useUserNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiRequest<UserNotificationsResponse>("/api/notifications"),
    enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
