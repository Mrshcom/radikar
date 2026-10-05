const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

export function formatPersianNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export function normalizeNumericInput(value: string | number) {
  return String(value)
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[^0-9]/g, "");
}

export function formatGroupedNumber(value: string | number, locale = "en-US") {
  const normalized = normalizeNumericInput(value);
  if (!normalized) return "";
  return Number(normalized).toLocaleString(locale);
}

/** Adds grouping to plain numeric amounts inside salary/price labels. */
export function formatGroupedNumericText(value: string) {
  return value.replace(/\d{4,}(?:\.\d+)?/g, (match) => {
    const [integer, fraction] = match.split(".");
    return `${Number(integer).toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
  });
}

export function formatDollarMicrosToTomans(micros: number, dollarRateRials?: number | null) {
  if (!dollarRateRials) return "نرخ دلار تنظیم نشده است";
  return `${((micros / 1_000_000) * dollarRateRials).toLocaleString("fa-IR", { maximumFractionDigits: 3 })} تومان`;
}

export function formatDollarTextToTomans(value: string, dollarRateRials?: number | null) {
  if (!dollarRateRials) return "نرخ دلار تنظیم نشده است";
  return value.replace(/(?:USD\s*)?\$?\s*(\d[\d,]*(?:\.\d+)?)/gi, (_, amount: string) => {
    const number = Number(amount.replace(/,/g, ""));
    return Number.isFinite(number)
      ? `${(number * dollarRateRials).toLocaleString("fa-IR", { maximumFractionDigits: 3 })} تومان`
      : amount;
  });
}
