"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiError, apiRequest } from "@/lib/api-client";
import { PageLoader } from "./page-loader";

export type UserRole = "user" | "admin" | "superadmin";
export type OnboardingStepId = "profile" | "match" | "resume" | "application" | "referral" | "interview";
export type OnboardingState = {
  version: number;
  status: "not_started" | "active" | "dismissed" | "completed";
  completedSteps: OnboardingStepId[];
};
export type CurrentUser = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  accountType: "candidate" | "employer";
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt: string | null;
  tablePageSize: 10 | 20 | 50 | 100 | 200;
  onboardingState: OnboardingState;
};

export const authQueryKey = ["auth", "me"] as const;
const sharedCustomerPaths = ["/account", "/orders", "/settings", "/referrals", "/radicoins", "/billing/result"];

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
  const wrongAccountPanel =
    user?.role === "user" &&
    (user.accountType === "employer") !== pathname.startsWith("/employer") &&
    !sharedCustomerPaths.includes(pathname);
  useEffect(() => {
    if (!isLoading && !user && error) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (!isLoading && isManagement && !isManagementPath) router.replace("/admin");
    if (!isLoading && user?.role === "user" && pathname.startsWith("/admin")) {
      router.replace(user.accountType === "employer" ? "/employer" : "/dashboard");
    }
    if (!isLoading && wrongAccountPanel) router.replace(user?.accountType === "employer" ? "/employer" : "/dashboard");
  }, [error, isLoading, isManagement, isManagementPath, pathname, router, user, wrongAccountPanel]);

  if (
    isLoading ||
    !user ||
    (isManagement && !isManagementPath) ||
    (user.role === "user" && pathname.startsWith("/admin")) ||
    wrongAccountPanel
  ) {
    return <PageLoader />;
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
