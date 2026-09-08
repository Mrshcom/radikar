import {
  createParser,
  parseAsNumberLiteral,
  parseAsStringLiteral,
} from "nuqs/server";

function boundedString(maxLength: number) {
  return createParser({
    parse(value) {
      const normalized = value.trim();
      return normalized.length <= maxLength ? normalized : null;
    },
    serialize(value) {
      return value;
    },
  });
}

export const tableSearchParser = boundedString(100).withDefault("");
export const tableOptionalFilterParser = boundedString(100).withDefault("");

export function createTableFilterParser<const Value extends string>(
  values: readonly Value[],
) {
  return parseAsStringLiteral(["", ...values] as const).withDefault("");
}

export const modelUsageDaysParser = parseAsNumberLiteral([7, 30, 90] as const)
  .withDefault(30);

export const tableQueryStateOptions = {
  history: "replace",
  shallow: true,
  scroll: false,
} as const;
