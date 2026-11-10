import { createTableFilterParser } from "./table-search-params";

export type AccountType = "candidate" | "employer";

export const accountTypeLabels: Record<AccountType, string> = {
  candidate: "کارجو",
  employer: "کارفرما",
};

export const accountTypeFilterParser = createTableFilterParser(["candidate", "employer"]);

export const accountTypeFilterOptions = [
  { value: "", label: "همه نوع حساب‌ها" },
  { value: "candidate", label: "کارجو" },
  { value: "employer", label: "کارفرما" },
];
