import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";

const regularFontPath = fileURLToPath(new URL("../../assets/vazirmatn-ui-regular.ttf", import.meta.url));
const boldFontPath = fileURLToPath(new URL("../../assets/vazirmatn-ui-bold.ttf", import.meta.url));
const blackFontPath = fileURLToPath(new URL("../../assets/vazirmatn-ui-black.ttf", import.meta.url));
const logoPath = fileURLToPath(new URL("../../assets/radikar-logo.png", import.meta.url));

export type InvoicePdfInput = {
  buyerName: string;
  buyerPhone: string | null;
  order: { amountRials: number; createdAt: Date; gateway: string; orderNumber: string; paidAt: Date | null; refId: string | null };
  plan: { durationDays: number; name: string };
};

type InvoiceAssets = { boldFont: string; blackFont: string; logo: string; regularFont: string };
type InvoiceFonts = Omit<InvoiceAssets, "logo">;

let fontsPromise: Promise<InvoiceFonts> | undefined;
let browserPromise: Promise<Browser> | undefined;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function formatPersianDateTime(value: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(value).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}/${parts.month}/${parts.day} - ${parts.hour}:${parts.minute}`;
}

function dataUri(mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function loadAssets() {
  fontsPromise ??= Promise.all([readFile(regularFontPath), readFile(boldFontPath), readFile(blackFontPath)]).then(
    ([regularFont, boldFont, blackFont]) => ({
      regularFont: dataUri("font/ttf", regularFont),
      boldFont: dataUri("font/ttf", boldFont),
      blackFont: dataUri("font/ttf", blackFont),
    }),
  );
  const [fonts, logo] = await Promise.all([fontsPromise, readFile(logoPath)]);
  return { ...fonts, logo: dataUri("image/png", logo) };
}

async function executablePath() {
  const candidates = [
    process.env.PDF_CHROMIUM_EXECUTABLE_PATH,
    chromium.executablePath(),
    process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next configured browser binary.
    }
  }
  throw new Error("مرورگر تولید PDF در دسترس نیست.");
}

async function getBrowser() {
  browserPromise ??= executablePath().then((path) => chromium.launch({ executablePath: path, headless: true }));
  return browserPromise;
}

function invoiceHtml(input: InvoicePdfInput, assets: InvoiceAssets) {
  const issuedAt = input.order.paidAt ?? input.order.createdAt;
  const amountRials = input.order.amountRials.toLocaleString("fa-IR");
  const buyerName = escapeHtml(input.buyerName);
  const buyerPhone = escapeHtml(input.buyerPhone ?? "—");
  const planName = escapeHtml(input.plan.name);
  const orderNumber = escapeHtml(input.order.orderNumber);
  const referenceId = escapeHtml(input.order.refId ?? "—");
  const paymentMethod = input.order.gateway === "radicoin" ? "رادیکوین" : "درگاه بانکی";

  return `<!doctype html>
<html dir="rtl" lang="fa">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 0; size: A4; }
      @font-face { font-family: Vazirmatn; font-style: normal; font-weight: 400; src: url('${assets.regularFont}') format('truetype'); }
      @font-face { font-family: Vazirmatn; font-style: normal; font-weight: 700; src: url('${assets.boldFont}') format('truetype'); }
      @font-face { font-family: Vazirmatn; font-style: normal; font-weight: 900; src: url('${assets.blackFont}') format('truetype'); }
      * { box-sizing: border-box; }
      html, body { background: #fff; color: #263832; direction: rtl; font-family: Vazirmatn, Tahoma, Arial, sans-serif; margin: 0; min-height: 297mm; width: 210mm; }
      .invoice { min-height: 297mm; padding: 9.5mm 10.5mm; }
      .header { align-items: flex-start; border-bottom: 2px solid #e7eae8; display: flex; justify-content: space-between; padding-bottom: 5mm; }
      .brand { align-items: center; display: flex; gap: 3.5mm; }
      .logo { height: 12mm; object-fit: contain; width: 12mm; }
      h1, h2, p { margin: 0; }
      .title { color: #19312f; font-size: 23px; font-weight: 900; letter-spacing: -.5px; line-height: 1.25; }
      .subtitle { color: #73837e; display: block; font-size: 9px; font-weight: 700; margin-top: 2px; }
      .meta { color: #475c54; direction: rtl; font-size: 10px; line-height: 2.3; text-align: left; }
      .section { border-bottom: 1px solid #e7eae8; padding: 5mm 0; }
      .section-title { color: #1d312b; font-size: 14px; font-weight: 900; }
      .details { column-gap: 8mm; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 3mm; row-gap: 1mm; }
      .detail { color: #344740; font-size: 10px; line-height: 1.9; }
      .detail strong { color: #1e322c; font-weight: 900; }
      .table-section { padding: 5mm 0; }
      table { border-collapse: collapse; margin-top: 3mm; table-layout: fixed; width: 100%; }
      th, td { border: 1px solid #dfe5e2; }
      th { background: #f5f7f6; color: #2e413a; font-size: 9px; font-weight: 900; padding: 3mm 2mm; text-align: center; }
      td { color: #344740; font-size: 10px; padding: 4mm 2mm; text-align: center; vertical-align: middle; }
      th:first-child, td:first-child { text-align: right; width: 48%; }
      th:nth-child(2), td:nth-child(2) { width: 12%; }
      th:nth-child(3), td:nth-child(3) { width: 21%; }
      th:nth-child(4), td:nth-child(4) { width: 19%; }
      td:first-child { font-weight: 700; padding-inline: 3mm; }
      .total { align-items: center; background: #fafbfa; border: 1px solid #dfe5e2; border-top: 0; display: flex; font-size: 11px; font-weight: 900; justify-content: space-between; padding: 3mm 4mm; }
      .payment { margin-top: 3mm; }
      .footer { align-items: flex-end; border-top: 2px solid #e7eae8; display: flex; justify-content: space-between; margin-top: 5mm; padding-top: 5mm; }
      .footer-note { color: #74837f; font-size: 9px; line-height: 1.8; max-width: 112mm; }
      .thanks { flex-shrink: 0; text-align: right; }
      .thanks strong { color: #385148; display: block; font-size: 11px; font-weight: 900; }
      .thanks span { color: #81908b; display: block; font-size: 9px; margin-top: 2px; }
    </style>
  </head>
  <body>
    <main class="invoice">
      <header class="header"><div class="brand"><img class="logo" src="${assets.logo}" alt="لوگوی رادیکار" /><div><h1 class="title">فاکتور فروش خدمات</h1><span class="subtitle">رادیکار · خدمات حرفه‌ای مسیر شغلی</span></div></div><div class="meta"><p><strong>شماره فاکتور: </strong><bdi dir="ltr">${orderNumber}</bdi></p><p><strong>تاریخ صدور: </strong><bdi dir="ltr">${formatPersianDateTime(issuedAt)}</bdi></p></div></header>
      <section class="section"><h2 class="section-title">اطلاعات فروشنده</h2><div class="details"><p class="detail"><strong>نام: </strong>رادیکار</p><p class="detail"><strong>نوع خدمات: </strong>سامانهٔ خدمات حرفه‌ای و استخدام</p></div></section>
      <section class="section"><h2 class="section-title">اطلاعات خریدار</h2><div class="details"><p class="detail"><strong>نام/شرکت: </strong>${buyerName}</p><p class="detail"><strong>شماره تماس: </strong><bdi dir="ltr">${buyerPhone}</bdi></p></div></section>
      <section class="table-section"><h2 class="section-title">جزئیات فاکتور</h2><table><thead><tr><th>شرح</th><th>تعداد</th><th>مبلغ واحد (ریال)</th><th>مبلغ کل (ریال)</th></tr></thead><tbody><tr><td>اشتراک پلن ${planName} · ${input.plan.durationDays.toLocaleString("fa-IR")} روز</td><td>۱</td><td>${amountRials}</td><td><strong>${amountRials}</strong></td></tr></tbody></table><div class="total"><strong>جمع کل (ریال)</strong><strong>${amountRials}</strong></div><div class="details payment"><p class="detail"><strong>روش پرداخت: </strong>${paymentMethod}</p><p class="detail"><strong>کد پیگیری: </strong><bdi dir="ltr">${referenceId}</bdi></p></div></section>
      <footer class="footer"><p class="footer-note">این فاکتور به‌صورت الکترونیکی توسط رادیکار صادر شده و اعتبار آن از طریق شماره فاکتور قابل پیگیری است.</p><div class="thanks"><strong>با سپاس از خرید شما</strong><span>رادیکار</span></div></footer>
    </main>
  </body>
</html>`;
}

export async function renderOfficialInvoicePdf(input: InvoicePdfInput) {
  const [assets, browser] = await Promise.all([loadAssets(), getBrowser()]);
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 794, height: 1123 } });
  try {
    await page.setContent(invoiceHtml(input, assets), { waitUntil: "load" });
    await page.emulateMedia({ media: "screen" });
    return await page.pdf({ format: "A4", margin: { bottom: "0", left: "0", right: "0", top: "0" }, preferCSSPageSize: true, printBackground: true });
  } finally {
    await page.close();
  }
}
