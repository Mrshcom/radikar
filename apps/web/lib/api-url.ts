export function apiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL برای اتصال Web به Node API تنظیم نشده است.",
    );
  }
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
