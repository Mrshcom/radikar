"use client";

import { ThinkingOrb, type OrbSize, type OrbTheme } from "thinking-orbs";

export function ModelThinkingOrb({
  label = "مدل در حال آماده‌سازی پاسخ است",
  size = 64,
  theme = "light",
  className,
}: {
  label?: string;
  size?: OrbSize;
  theme?: OrbTheme;
  className?: string;
}) {
  return <ThinkingOrb aria-label={label} className={className} size={size} state="composing" theme={theme} />;
}
