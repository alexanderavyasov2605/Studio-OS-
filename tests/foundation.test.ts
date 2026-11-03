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
        expect(source, file).not.toMatch(/(?:from\s*|import\s*)["'][^"']*(?:server\/|@prisma\/)/);
        expect(source, file).not.toMatch(/process\.env|process\[["']env["']\]/);
      }
    }
  });

  it("marks the server entry point as server-only", () => {
    expect(readFileSync(resolve("server/index.ts"), "utf8")).toContain('import "server-only"');
  });
});
