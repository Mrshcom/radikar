"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductTimelineEntry, ProductTimelineInput } from "@radikar/shared-types";
import { apiRequest } from "@/lib/api-client";

const timelineQueryKey = ["product-timeline", "published"] as const;
const adminTimelineQueryKey = ["product-timeline", "admin"] as const;
const storyWindowMs = 7 * 24 * 60 * 60 * 1000;

export function isStoryFresh(entry: ProductTimelineEntry, now = new Date()) {
  if (entry.kind === "phase" || entry.storySlides.length === 0 || !entry.publishedAt) return false;
  const publishedAt = Date.parse(entry.publishedAt);
  const elapsed = now.getTime() - publishedAt;
  return Number.isFinite(publishedAt) && elapsed >= 0 && elapsed < storyWindowMs;
}

export function useProductTimeline() {
  return useQuery({
    queryKey: timelineQueryKey,
    queryFn: () => apiRequest<{ items: ProductTimelineEntry[] }>("/api/product-timeline"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useAdminProductTimeline(enabled = true) {
  return useQuery({
    queryKey: adminTimelineQueryKey,
    queryFn: () => apiRequest<{ items: ProductTimelineEntry[] }>("/api/admin/product-timeline"),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

function useInvalidateTimeline() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: adminTimelineQueryKey }),
      client.invalidateQueries({ queryKey: timelineQueryKey }),
    ]);
}

export function useSaveProductTimeline() {
  const invalidate = useInvalidateTimeline();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductTimelineInput }) =>
      apiRequest<{ item: ProductTimelineEntry }>(
        id ? `/api/admin/product-timeline/${id}` : "/api/admin/product-timeline",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: invalidate,
  });
}

export function useSetProductTimelinePublication() {
  const invalidate = useInvalidateTimeline();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiRequest<{ item: ProductTimelineEntry }>(
        `/api/admin/product-timeline/${id}/${published ? "publish" : "unpublish"}`,
        { method: "POST" },
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteProductTimeline() {
  const invalidate = useInvalidateTimeline();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/api/admin/product-timeline/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
