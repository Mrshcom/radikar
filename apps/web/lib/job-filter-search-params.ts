import {
  createParser,
  debounce,
  parseAsString,
  parseAsStringLiteral,
  throttle,
  type UrlKeys,
} from "nuqs/server";

export const jobScopes = [
  "all",
  "domestic",
  "international",
  "remote",
] as const;

const boundedMatchParser = createParser({
  parse(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 95
      ? parsed
      : null;
  },
  serialize(value) {
    return String(value);
  },
});

const localIsoDateParser = createParser({
  parse(value) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
    );
    const normalized = [
      String(parsed.getFullYear()).padStart(4, "0"),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0"),
    ].join("-");
    return normalized === value ? value : null;
  },
  serialize(value) {
    return value;
  },
});

export const jobFilterParsers = {
  query: parseAsString
    .withDefault("")
    .withOptions({ limitUrlUpdates: debounce(250) }),
  scope: parseAsStringLiteral(jobScopes).withDefault("all"),
  minMatch: boundedMatchParser
    .withDefault(0)
    .withOptions({ limitUrlUpdates: throttle(120) }),
  fromDate: localIsoDateParser.withDefault(""),
  toDate: localIsoDateParser.withDefault(""),
};

export const jobFilterUrlKeys: UrlKeys<typeof jobFilterParsers> = {
  query: "q",
  scope: "scope",
  minMatch: "match",
  fromDate: "from",
  toDate: "to",
};

export type JobScope = (typeof jobScopes)[number];
