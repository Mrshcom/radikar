"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authQueryKey,
  useAuth,
  type CurrentUser,
} from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";

export const tablePageSizes = [10, 20, 50, 100, 200] as const;
export type TablePageSize = (typeof tablePageSizes)[number];

type AuthResponse = { user: CurrentUser };

export function useTablePageSize() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (tablePageSize: TablePageSize) =>
      apiRequest<AuthResponse>("/api/account/preferences", {
        method: "PATCH",
        body: JSON.stringify({ tablePageSize }),
      }),
    onMutate: async (tablePageSize) => {
      await queryClient.cancelQueries({ queryKey: authQueryKey });
      const previous = queryClient.getQueryData<AuthResponse>(authQueryKey);
      queryClient.setQueryData<AuthResponse>(authQueryKey, (current) =>
        current ? { user: { ...current.user, tablePageSize } } : current,
      );
      return { previous };
    },
    onError: (_error, _tablePageSize, context) => {
      if (context?.previous) queryClient.setQueryData(authQueryKey, context.previous);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKey, response);
    },
  });

  return {
    pageSize: user?.tablePageSize ?? 20,
    setPageSize: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
