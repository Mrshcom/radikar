"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import {
  authQueryKey,
  useAuth,
  type CurrentUser,
} from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import {
  tablePaginationParsers,
  type TablePageSize,
} from "@/lib/table-pagination-search-params";

export {
  tablePageSizes,
  type TablePageSize,
} from "@/lib/table-pagination-search-params";

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

export function useUrlTablePagination() {
  const stored = useTablePageSize();
  const [urlState, setUrlState] = useQueryStates(tablePaginationParsers, {
    history: "replace",
    shallow: true,
    scroll: false,
  });
  const pageSize = urlState.pageSize ?? stored.pageSize;

  return {
    page: urlState.page,
    pageSize,
    setPage: (page: number) => void setUrlState({ page }),
    setPageSize: (nextPageSize: TablePageSize) => {
      void setUrlState({ page: 1, pageSize: nextPageSize });
      stored.setPageSize(nextPageSize);
    },
    isSaving: stored.isSaving,
  };
}
