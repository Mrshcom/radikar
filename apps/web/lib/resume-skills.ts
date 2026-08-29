function isStandaloneTechnicalToken(value: string) {
  return (
    value.includes(".") ||
    /[a-z][A-Z]/.test(value) ||
    /(?:JS|SQL|HTML|CSS|PHP|API|AWS|GCP|UI|UX)$/i.test(value)
  );
}

export function parseResumeSkills(value: unknown): string[] {
  const rawItems = Array.isArray(value) ? value : [value];
  return rawItems
    .flatMap((item) =>
      typeof item === "string" ? item.split(/[,،;؛|\n]/) : [],
    )
    .flatMap((item) => {
      const trimmed = item.trim();
      if (!trimmed || !/\s/.test(trimmed)) return trimmed ? [trimmed] : [];
      const tokens = trimmed.split(/\s+/);
      return tokens.length > 1 && tokens.every(isStandaloneTechnicalToken)
        ? tokens
        : [trimmed];
    })
    .filter(Boolean);
}

export function serializeResumeSkills(value: unknown) {
  return parseResumeSkills(value).join(", ");
}
