"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";

export const jobPoolPageSizes = [9, 30, 60] as const;
export type JobPoolPageSize = (typeof jobPoolPageSizes)[number];

export type PublicJobPoolListing = {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
  canonicalUrl: string;
  workplaceType: string | null;
  employmentType: string | null;
  salaryText: string | null;
  salaryPeriod: "monthly" | "yearly" | "unknown";
  postedAt: string | null;
  description: string | null;
  skills: string[];
};

export type PublicJobPoolResponse = {
  items: PublicJobPoolListing[];
  total: number;
  page: number;
  pageSize: number;
};

export function jobPoolQueryKey(query: string, page: number, pageSize: number) {
  return ["job-pool", "public", { query, page, pageSize }] as const;
}

export function useJobPoolListings({
  query = "",
  page = 1,
  pageSize = 6,
}: {
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: jobPoolQueryKey(normalizedQuery, page, pageSize),
    queryFn: () =>
      apiRequest<PublicJobPoolResponse>(
        `/api/job-pool/jobs?${buildQueryString({
          query: normalizedQuery,
          page,
          pageSize,
        })}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
