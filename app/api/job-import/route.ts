import { NextRequest, NextResponse } from "next/server";
import { getLinkedInJobId, isLinkedInHost, resolveJobUrls } from "@/lib/job-url";

const MAX_TEXT_LENGTH = 7000;
const ALLOWED_HOST_SUFFIXES = [
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

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function extractMetaContent(html: string, property: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1] ?? "";
}

function pickJobPosting(payload: unknown): Record<string, unknown> | undefined {
  const items = Array.isArray(payload) ? payload : [payload];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const typedItem = item as Record<string, unknown>;
    if (typedItem["@type"] === "JobPosting") return typedItem;
    const graph = typedItem["@graph"];
    if (!Array.isArray(graph)) continue;
    const posting = graph.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>)["@type"] === "JobPosting");
    if (posting && typeof posting === "object") return posting as Record<string, unknown>;
  }
}

function extractJobText(html: string) {
  const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLdMatches) {
    try {
      const posting = pickJobPosting(JSON.parse(match[1]));
      if (posting?.description) {
        return normalizeWhitespace(decodeEntities(String(posting.description).replace(/<[^>]+>/g, " "))).slice(0, MAX_TEXT_LENGTH);
      }
    } catch {
      continue;
    }
  }

  const prepared = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const metaDescription = extractMetaContent(prepared, "og:description") || extractMetaContent(prepared, "description");
  const bodyText = prepared
    .replace(/<\/(p|div|li|h[1-6]|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return normalizeWhitespace(decodeEntities(`${metaDescription}\n${bodyText}`)).slice(0, MAX_TEXT_LENGTH);
}

export async function POST(request: NextRequest) {
  const { url } = await request.json().catch(() => ({ url: "" }));

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "لینک آگهی را وارد کن." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: "فرمت لینک معتبر نیست." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol) || !isAllowedHost(parsedUrl.hostname)) {
    return NextResponse.json({ error: "فعلاً فقط لینک job boardهای معتبر پشتیبانی می‌شود." }, { status: 400 });
  }

  const linkedInJobId = getLinkedInJobId(parsedUrl);
  if (isLinkedInHost(parsedUrl.hostname) && parsedUrl.pathname.startsWith("/jobs/search") && !linkedInJobId) {
    return NextResponse.json({
      error: "این لینک فقط صفحه جستجوی لینکدین است. ابتدا یک شغل را باز کن تا شناسه currentJobId به لینک اضافه شود.",
    }, { status: 400 });
  }

  const { fetchUrl, sourceUrl } = resolveJobUrls(parsedUrl);

  try {
    const response = await fetch(fetchUrl, {
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: "این لینک redirect دارد؛ لینک نهایی آگهی را وارد کن." }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: "متن آگهی از این لینک قابل دریافت نبود." }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return NextResponse.json({ error: "این لینک صفحه HTML قابل خواندن برنگرداند." }, { status: 415 });
    }

    const text = extractJobText(await response.text());
    if (text.length < 80) {
      return NextResponse.json({ error: "متن کافی برای پردازش از این آگهی پیدا نشد." }, { status: 422 });
    }

    return NextResponse.json({ text, sourceUrl: sourceUrl.toString() });
  } catch {
    return NextResponse.json({ error: "خواندن لینک آگهی با خطا روبه‌رو شد." }, { status: 502 });
  }
}
