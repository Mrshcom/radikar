export type QueryParameter = string | number | boolean | null | undefined;

export function buildQueryString(parameters: Record<string, QueryParameter>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
}
