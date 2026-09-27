import { afterEach, describe, expect, it } from "vitest";
import { formatPersianNumber, toPersianDigits } from "@/lib/fa-number";
import { validateJobDescription } from "@/lib/job-description-validation";
import { getLinkedInJobId, isLinkedInHost, resolveJobUrls } from "@/lib/job-url";
import { sanitizeLtrField } from "@/lib/ltr-field";
import { applyFieldDirection, getFieldDirection, refreshFieldDirections } from "@/lib/field-direction";
import { readProfileImage } from "@/lib/image-file";
import { createQueryClient, getBrowserQueryClient } from "@/lib/query-client";
import { billingKeys, formatLimit, formatTomans } from "@/lib/billing";
import { skillSuggestions } from "@/lib/skill-suggestions";

describe("pure web helpers", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("formats Persian numbers, currency and usage limits", () => {
    expect(toPersianDigits("Order 123")).toBe("Order ۱۲۳");
    expect(formatPersianNumber(1234567)).toMatch(/۱.*۲.*۳/);
    expect(formatTomans(125_000)).toContain("۱۲٬۵۰۰");
    expect(formatLimit(null)).toContain("نامحدود");
    expect(formatLimit(12)).toBe("۱۲");
    expect(billingKeys.orders(2, 10, "RK", "paid")).toEqual(["billing", "orders", 2, 10, "RK", "paid", "", ""]);
  });

  it("validates job descriptions and resolves LinkedIn canonical URLs", () => {
    expect(validateJobDescription("خیلی کوتاه").valid).toBe(false);
    expect(validateJobDescription("این متن ".repeat(25)).valid).toBe(false);
    expect(validateJobDescription("برای تیم محصول به توسعه‌دهنده فرانت‌اند نیاز داریم تا رابط کاربری، تست، نگهداری کد و همکاری با طراحان را انجام دهد و با React و TypeScript مسلط باشد.")).toEqual({ valid: true });
    expect(isLinkedInHost("jobs.linkedin.com")).toBe(true);
    expect(isLinkedInHost("linkedin.evil.test")).toBe(false);
    const url = new URL("https://www.linkedin.com/jobs/view/senior-engineer-123456789/?trk=x");
    expect(getLinkedInJobId(url)).toBe("123456789");
    expect(resolveJobUrls(url).fetchUrl.toString()).toContain("jobPosting/123456789");
    expect(resolveJobUrls(url).sourceUrl.toString()).toBe("https://www.linkedin.com/jobs/view/123456789/");
  });

  it("sets safe input directions and removes Persian text from LTR fields", () => {
    const email = document.createElement("input"); email.type = "email"; email.value = "کاربر@example.com";
    const persian = document.createElement("textarea"); persian.value = "متن فارسی";
    const numeric = document.createElement("input"); numeric.value = "۱۲۳٬۴۵۶";
    document.body.append(email, persian, numeric);
    expect(getFieldDirection(email)).toBe("ltr");
    expect(getFieldDirection(persian)).toBe("rtl");
    expect(getFieldDirection(numeric)).toBe("ltr");
    refreshFieldDirections(); applyFieldDirection(persian);
    expect(email.dir).toBe("ltr"); expect(persian.style.textAlign).toBe("right");
    expect(sanitizeLtrField("Ali علی 123")).toBe("Ali  123");
  });

  it("rejects unsafe profile images before reading and configures query caching", async () => {
    await expect(readProfileImage(new File(["x"], "resume.pdf", { type: "application/pdf" }))).rejects.toThrow("تصویر");
    await expect(readProfileImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).rejects.toThrow("۵ مگابایت");
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
    expect(client.getDefaultOptions().mutations?.retry).toBe(0);
    expect(getBrowserQueryClient()).toBe(getBrowserQueryClient());
    expect(skillSuggestions).toContain("React.js");
    expect(new Set(skillSuggestions).size).toBe(skillSuggestions.length);
  });
});
