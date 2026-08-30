import { z } from "zod";
import { dataCollections } from "@radicar/shared-types";

const localizedDigitPattern = /[۰-۹٠-٩]/g;
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string) {
  return value.replace(localizedDigitPattern, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

export function normalizeDigitsDeep<T>(value: T): T {
  if (typeof value === "string") return normalizeDigits(value) as T;
  if (Array.isArray(value)) return value.map(normalizeDigitsDeep) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeDigitsDeep(nestedValue)]),
    ) as T;
  }
  return value;
}

export const dataCollectionSchema = z.enum(dataCollections);

export const baseRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(255),
    profileId: z.string().trim().min(1).max(255).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .loose();
