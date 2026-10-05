export type UserIdentity = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export function userIdentifier(user: UserIdentity) {
  return user.phone || user.email || "شناسه ثبت‌نشده";
}

export function userDisplayName(user: UserIdentity) {
  return user.fullName || userIdentifier(user);
}
