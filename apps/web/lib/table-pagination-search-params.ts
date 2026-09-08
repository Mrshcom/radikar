import { createParser, parseAsNumberLiteral } from "nuqs/server";

export const tablePageSizes = [10, 20, 50, 100, 200] as const;
export type TablePageSize = (typeof tablePageSizes)[number];

const positivePageParser = createParser({
  parse(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : null;
  },
  serialize(value) {
    return String(value);
  },
});

export const tablePaginationParsers = {
  page: positivePageParser.withDefault(1),
  pageSize: parseAsNumberLiteral(tablePageSizes),
};
