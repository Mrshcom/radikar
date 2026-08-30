"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiError, apiRequest } from "@/lib/api-client";

export type UserRole = "user" | "admin" | "superadmin";
export type CurrentUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt: string | null;
};

export const authQueryKey = ["auth", "me"] as const;

export function useAuth() {
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: () => apiRequest<{ user: CurrentUser }>("/api/auth/me"),
    retry: (attempt, error) => !(error instanceof ApiError && error.status === 401) && attempt < 2,
    staleTime: 60_000,
  });
  return { ...query, user: query.data?.user ?? null };
}

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, error } = useAuth();
  const isManagement = user?.role === "admin" || user?.role === "superadmin";
  const isManagementPath = pathname.startsWith("/admin") || pathname === "/settings";
  useEffect(() => {
    if (!isLoading && !user && error) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (!isLoading && isManagement && !isManagementPath) router.replace("/admin");
    if (!isLoading && user?.role === "user" && pathname.startsWith("/admin")) {
      router.replace("/dashboard");
    }
  }, [error, isLoading, isManagement, isManagementPath, pathname, router, user]);

  if (
    isLoading ||
    !user ||
    (isManagement && !isManagementPath) ||
    (user.role === "user" && pathname.startsWith("/admin"))
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f2] text-[13px] text-[#687a76]">
        در حال بررسی نشست کاربری...
      </main>
    );
  }
  return children;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.replace("/login");
  };
}
