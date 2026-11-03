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
  {
    files: ["app/admin/**/page.tsx", "app/admin/**/layout.tsx", "app/api/admin/**/route.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: "^(?:@/server(?:$|/(?!(?:auth/(?:pages|http)|catalog/admin)$))|(?:\\.\\./)+server(?:/|$)|@prisma/)",
          message: "Server routes may use only the auth entry points, never database/internal modules." }]
      }]
    }
  },
  {
    files: ["app/(public)/catalog/(listing)/page.tsx", "app/(public)/catalog/[[]slug[]]/page.tsx"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ regex: "^(?:@/server(?:$|/(?!catalog$))|(?:\\.\\./)+server(?:/|$)|@prisma/)", message: "Public catalog pages may use only the marked catalog entry point." }] }] }
  },
  globalIgnores([".next/**", ".next-auth/**", ".next-auth-*/**", ".pnpm-store/**", ".pnpm-cache/**", "out/**", "coverage/**", "server/generated/**", "next-env.d.ts"])
]);
