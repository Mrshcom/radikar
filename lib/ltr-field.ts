const PERSIAN_OR_ARABIC_CHARACTER = /\p{Script=Arabic}/gu;

export function sanitizeLtrField(value: string) {
  return value.replace(PERSIAN_OR_ARABIC_CHARACTER, "");
}
