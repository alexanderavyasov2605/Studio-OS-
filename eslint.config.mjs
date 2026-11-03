import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/server", "@/server/**", "**/server", "**/server/**", "@prisma/*"],
            message: "UI and shared modules must not import server business logic or database clients." }
        ]
      }]
    }
  },
  globalIgnores([".next/**", ".pnpm-store/**", ".pnpm-cache/**", "out/**", "coverage/**", "server/generated/**", "next-env.d.ts"])
]);
