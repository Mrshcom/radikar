"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/app/_components/auth";

type MarketingAuthLinkProps = {
  children: ReactNode;
  authenticatedChildren?: ReactNode;
  className?: string;
  hideWhenAuthenticated?: boolean;
};

export function MarketingAuthLink({
  children,
  authenticatedChildren,
  className,
  hideWhenAuthenticated = false,
}: MarketingAuthLinkProps) {
  const { user, isLoading } = useAuth();

  if (hideWhenAuthenticated && (isLoading || user)) return null;

  const href = user
    ? user.role === "user"
      ? "/dashboard"
      : "/admin"
    : "/login";

  return (
    <Link href={href} className={className}>
      {user && authenticatedChildren ? authenticatedChildren : children}
    </Link>
  );
}
