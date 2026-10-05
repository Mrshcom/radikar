import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      // Test doubles need intentionally loose props and mocked cache payloads.
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
    },
  },
]);

export default eslintConfig;
