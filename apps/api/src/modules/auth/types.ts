export const roles = ["user", "admin", "superadmin"] as const;
export type UserRole = (typeof roles)[number];
export type UserStatus = "active" | "suspended";

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  tablePageSize: 10 | 20 | 50 | 100 | 200;
};

export type SessionIdentity = { user: AuthUser; sessionId: string };

export type Permission =
  | "own:data:read"
  | "own:data:write"
  | "users:read:any"
  | "reports:read:any"
  | "orders:read:any"
  | "payments:read:any"
  | "memberships:manage:any";

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  user: new Set(["own:data:read", "own:data:write"]),
  admin: new Set([
    "orders:read:any",
    "payments:read:any",
    "memberships:manage:any",
  ]),
  superadmin: new Set([
    "users:read:any",
    "reports:read:any",
    "orders:read:any",
    "payments:read:any",
    "memberships:manage:any",
  ]),
};

export function can(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}
