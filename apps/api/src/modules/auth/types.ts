export const roles = ["user", "admin", "superadmin"] as const;
export type UserRole = (typeof roles)[number];
export type UserStatus = "active" | "suspended";
export type OnboardingStepId = "profile" | "match" | "resume" | "application";
export type OnboardingState = {
  version: number;
  status: "not_started" | "active" | "dismissed" | "completed";
  completedSteps: OnboardingStepId[];
};

export type AuthUser = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  tablePageSize: 10 | 20 | 50 | 100 | 200;
  onboardingState: OnboardingState;
};

export type SessionIdentity = { user: AuthUser; sessionId: string };

export type Permission =
  | "own:data:read"
  | "own:data:write"
  | "users:read:any"
  | "reports:read:any"
  | "orders:read:any"
  | "payments:read:any"
  | "memberships:manage:any"
  | "radicoin:manage:any"
  | "ai-settings:manage:any"
  | "job-pool:manage:any";

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  user: new Set(["own:data:read", "own:data:write"]),
  admin: new Set(["orders:read:any", "payments:read:any", "memberships:manage:any"]),
  superadmin: new Set([
    "users:read:any",
    "reports:read:any",
    "orders:read:any",
    "payments:read:any",
    "memberships:manage:any",
    "radicoin:manage:any",
    "ai-settings:manage:any",
    "job-pool:manage:any",
  ]),
};

export function can(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}
