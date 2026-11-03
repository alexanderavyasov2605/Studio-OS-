import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sources(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}

describe("architecture boundaries", () => {
  it("keeps database clients, server imports and private environment access out of UI/shared code", () => {
    for (const directory of ["app", "components", "lib"]) {
      for (const file of sources(resolve(directory))) {
        const source = readFileSync(file, "utf8");
        const adapters = new Map([
          [resolve("app/admin/login/page.tsx"), "@/server/auth/pages"],
          [resolve("app/admin/(protected)/layout.tsx"), "@/server/auth/pages"],
          [resolve("app/admin/(protected)/page.tsx"), "@/server/auth/pages"],
          [resolve("app/admin/(protected)/catalog/page.tsx"), "@/server/catalog/admin"],
          [resolve("app/(public)/catalog/(listing)/page.tsx"), "@/server/catalog"],
          [resolve("app/(public)/catalog/[slug]/page.tsx"), "@/server/catalog"],
          [resolve("app/api/admin/[...segments]/route.ts"), "@/server/auth/http"],
        ]);
        const entry = adapters.get(file);
        if (entry) expect(source, file).not.toMatch(/["']use client["']/);
        const imports = entry ? source.replaceAll('"' + entry + '"', '"auth-server-entry"') : source;
        expect(imports, file).not.toMatch(/(?:from\s*|import\s*)["'][^"']*(?:server\/|@prisma\/)/);
        // NODE_ENV in the server-rendered /ui-kit page is a build-mode gate, not a secret.
        const checked = file === resolve("app/(public)/ui-kit/page.tsx")
          ? source.replaceAll("process.env.NODE_ENV", '"build-mode"')
          : source;
        expect(checked, file).not.toMatch(/process\.env|process\[["']env["']\]/);
      }
    }
  });

  it("marks the server entry point as server-only", () => {
    expect(readFileSync(resolve("server/index.ts"), "utf8")).toContain('import "server-only"');
  });
});
