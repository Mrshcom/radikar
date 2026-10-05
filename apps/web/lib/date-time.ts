const persianDateTimePartsFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatPersianDateTime(value: string | Date, fallback = "—") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const parts = Object.fromEntries(
    persianDateTimePartsFormatter.formatToParts(date).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}/${parts.month}/${parts.day} - ${parts.hour}:${parts.minute}`;
}
