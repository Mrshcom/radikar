import { normalizeDigits } from "@radikar/validators";

const PERSIAN_OR_ARABIC_CHARACTER = /\p{Script=Arabic}/gu;

export function sanitizeLtrField(value: string) {
  return normalizeDigits(value).replace(PERSIAN_OR_ARABIC_CHARACTER, "");
}
