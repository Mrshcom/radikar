const persianPartsFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-latn",
  { year: "numeric", month: "numeric", day: "numeric" },
);

const persianDisplayFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian",
  { year: "numeric", month: "2-digit", day: "2-digit" },
);

const persianMonthFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian",
  { year: "numeric", month: "long" },
);

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addCalendarDays(date: Date, days: number) {
  const result = atNoon(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function parseLocalIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toLocalIsoDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPersianDateParts(date: Date) {
  const parts = persianPartsFormatter.formatToParts(date);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: valueOf("year"),
    month: valueOf("month"),
    day: valueOf("day"),
  };
}

export function getPersianMonthDays(anchor: Date) {
  const normalizedAnchor = atNoon(anchor);
  const anchorParts = getPersianDateParts(normalizedAnchor);
  const firstDay = addCalendarDays(normalizedAnchor, 1 - anchorParts.day);
  const days: Date[] = [];
  for (let index = 0; index < 32; index += 1) {
    const date = addCalendarDays(firstDay, index);
    const parts = getPersianDateParts(date);
    if (
      parts.year !== anchorParts.year ||
      parts.month !== anchorParts.month
    )
      break;
    days.push(date);
  }
  return days;
}

export function shiftPersianMonth(anchor: Date, offset: -1 | 1) {
  const days = getPersianMonthDays(anchor);
  return offset === -1
    ? addCalendarDays(days[0], -1)
    : addCalendarDays(days[days.length - 1], 1);
}

export function formatPersianCalendarDate(date: Date) {
  return persianDisplayFormatter.format(date);
}

export function formatPersianCalendarMonth(date: Date) {
  return persianMonthFormatter.format(date);
}
