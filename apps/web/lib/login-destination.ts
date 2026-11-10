export type LoginPortal = "candidate" | "employer";

function safeNextPath(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") && !/[\r\n]/.test(next) ? next : null;
}

export function portalFromLoginQuery(search: string): LoginPortal {
  const query = new URLSearchParams(search);
  return query.get("mode") === "employer" || safeNextPath(query.get("next"))?.startsWith("/employer")
    ? "employer"
    : "candidate";
}

export function loginDestination(portal: LoginPortal, next: string | null, role: string = "user") {
  if (role !== "user") return "/admin";
  const safeNext = safeNextPath(next);
  if (portal === "employer") return safeNext?.startsWith("/employer") ? safeNext : "/employer";
  return safeNext && !safeNext.startsWith("/employer") ? safeNext : "/dashboard";
}
