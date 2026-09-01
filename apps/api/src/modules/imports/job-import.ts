import type { FastifyInstance } from "fastify";
import { sanitizeRemoteImageSource } from "@radicar/validators";

const maxTextLength = 7000;
const allowedHostSuffixes = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "wellfound.com",
  "greenhouse.io",
  "lever.co",
  "workable.com",
  "jobinja.ir",
  "jobvision.ir",
  "quera.org",
  "karboom.io",
  "e-estekhdam.com",
  "irantalent.com",
];

function isLinkedInHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

function getLinkedInJobId(url: URL) {
  if (!isLinkedInHost(url.hostname)) return null;
  const currentJobId = url.searchParams.get("currentJobId");
  if (currentJobId && /^\d{6,20}$/.test(currentJobId)) return currentJobId;
  return url.pathname.match(
    /\/jobs\/view\/(?:[^/?]*-)?(\d{6,20})(?:\/|$)/i,
  )?.[1] ?? null;
}

function resolveJobUrls(url: URL) {
  const linkedInJobId = getLinkedInJobId(url);
  if (!linkedInJobId) return { fetchUrl: url, sourceUrl: url };
  return {
    fetchUrl: new URL(
      `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${linkedInJobId}`,
    ),
    sourceUrl: new URL(`https://www.linkedin.com/jobs/view/${linkedInJobId}/`),
  };
}

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":")
  )
    return false;
  return allowedHostSuffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractMetaContent(html: string, property: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const key = extractAttribute(tag, "property") || extractAttribute(tag, "name");
    if (key.toLowerCase() === property.toLowerCase())
      return extractAttribute(tag, "content");
  }
  return "";
}

function extractAttribute(tag: string, attribute: string) {
  return tag.match(
    new RegExp(`\\s${attribute}=["']([^"']+)["']`, "i"),
  )?.[1] ?? "";
}

function normalizeLogoUrl(value: unknown, pageUrl: URL) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const logoUrl = new URL(decodeEntities(value.trim()), pageUrl);
    return sanitizeRemoteImageSource(logoUrl.toString()).slice(0, 2_048);
  } catch {
    return "";
  }
}

function organizationLogo(posting: Record<string, unknown> | undefined) {
  if (!posting?.hiringOrganization) return "";
  const organization = posting.hiringOrganization;
  if (typeof organization !== "object" || Array.isArray(organization))
    return "";
  const logo = (organization as Record<string, unknown>).logo;
  if (typeof logo === "string") return logo;
  if (!logo || typeof logo !== "object" || Array.isArray(logo)) return "";
  const logoRecord = logo as Record<string, unknown>;
  return typeof logoRecord.url === "string"
    ? logoRecord.url
    : typeof logoRecord.contentUrl === "string"
      ? logoRecord.contentUrl
      : "";
}

export function extractCompanyLogoUrl(html: string, pageUrl: URL) {
  const candidates: string[] = [];
  const jsonLdMatches = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const match of jsonLdMatches) {
    try {
      const logo = organizationLogo(pickJobPosting(JSON.parse(match[1])));
      if (logo) candidates.push(logo);
    } catch {
      continue;
    }
  }

  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imageTags) {
    if (
      !/(?:company|employer|organization)[-_\s]?logo|artdeco-entity-image/i.test(
        tag,
      )
    )
      continue;
    for (const attribute of ["data-delayed-url", "data-src", "src"]) {
      const value = extractAttribute(tag, attribute);
      if (value) candidates.push(value);
    }
  }

  candidates.push(
    extractMetaContent(html, "og:image"),
    extractMetaContent(html, "twitter:image"),
  );
  for (const candidate of candidates) {
    const normalized = normalizeLogoUrl(candidate, pageUrl);
    if (normalized) return normalized;
  }
  return "";
}

function pickJobPosting(payload: unknown): Record<string, unknown> | undefined {
  const items = Array.isArray(payload) ? payload : [payload];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const typedItem = item as Record<string, unknown>;
    if (typedItem["@type"] === "JobPosting") return typedItem;
    const graph = typedItem["@graph"];
    if (!Array.isArray(graph)) continue;
    const posting = graph.find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>)["@type"] === "JobPosting",
    );
    if (posting && typeof posting === "object")
      return posting as Record<string, unknown>;
  }
}

function extractJobText(html: string) {
  const jsonLdMatches = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const match of jsonLdMatches) {
    try {
      const posting = pickJobPosting(JSON.parse(match[1]));
      if (posting?.description) {
        return normalizeWhitespace(
          decodeEntities(String(posting.description).replace(/<[^>]+>/g, " ")),
        ).slice(0, maxTextLength);
      }
    } catch {
      continue;
    }
  }
  const prepared = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const metaDescription =
    extractMetaContent(prepared, "og:description") ||
    extractMetaContent(prepared, "description");
  const bodyText = prepared
    .replace(/<\/(p|div|li|h[1-6]|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return normalizeWhitespace(
    decodeEntities(`${metaDescription}\n${bodyText}`),
  ).slice(0, maxTextLength);
}

export function registerJobImportRoute(app: FastifyInstance) {
  app.post("/api/job-import", async (request, reply) => {
    const body = (request.body ?? {}) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim())
      return reply.code(400).send({ error: "لینک آگهی را وارد کن." });

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url.trim());
    } catch {
      return reply.code(400).send({ error: "فرمت لینک معتبر نیست." });
    }
    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !isAllowedHost(parsedUrl.hostname)
    )
      return reply
        .code(400)
        .send({ error: "فعلاً فقط لینک job boardهای معتبر پشتیبانی می‌شود." });

    const linkedInJobId = getLinkedInJobId(parsedUrl);
    if (
      isLinkedInHost(parsedUrl.hostname) &&
      parsedUrl.pathname.startsWith("/jobs/search") &&
      !linkedInJobId
    )
      return reply.code(400).send({
        error:
          "این لینک فقط صفحه جستجوی لینکدین است. ابتدا یک شغل را باز کن تا شناسه currentJobId به لینک اضافه شود.",
      });

    const { fetchUrl, sourceUrl } = resolveJobUrls(parsedUrl);
    try {
      const response = await fetch(fetchUrl, {
        redirect: "manual",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
        },
      });
      if (response.status >= 300 && response.status < 400)
        return reply
          .code(400)
          .send({ error: "این لینک redirect دارد؛ لینک نهایی آگهی را وارد کن." });
      if (!response.ok)
        return reply
          .code(502)
          .send({ error: "متن آگهی از این لینک قابل دریافت نبود." });
      const contentType = response.headers.get("content-type") ?? "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")
      )
        return reply
          .code(415)
          .send({ error: "این لینک صفحه HTML قابل خواندن برنگرداند." });
      const html = await response.text();
      const text = extractJobText(html);
      if (text.length < 80)
        return reply
          .code(422)
          .send({ error: "متن کافی برای پردازش از این آگهی پیدا نشد." });
      return {
        text,
        sourceUrl: sourceUrl.toString(),
        logoUrl: extractCompanyLogoUrl(html, fetchUrl) || undefined,
      };
    } catch {
      return reply
        .code(502)
        .send({ error: "خواندن لینک آگهی با خطا روبه‌رو شد." });
    }
  });
}
