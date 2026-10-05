export function isLinkedInHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

export function getLinkedInJobId(url: URL) {
  if (!isLinkedInHost(url.hostname)) return null;

  const currentJobId = url.searchParams.get("currentJobId");
  if (currentJobId && /^\d{6,20}$/.test(currentJobId)) return currentJobId;

  const pathMatch = url.pathname.match(/\/jobs\/view\/(?:[^/?]*-)?(\d{6,20})(?:\/|$)/i);
  return pathMatch?.[1] ?? null;
}

export function resolveJobUrls(url: URL) {
  const linkedInJobId = getLinkedInJobId(url);
  if (!linkedInJobId) return { fetchUrl: url, sourceUrl: url };

  return {
    fetchUrl: new URL(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${linkedInJobId}`),
    sourceUrl: new URL(`https://www.linkedin.com/jobs/view/${linkedInJobId}/`),
  };
}
