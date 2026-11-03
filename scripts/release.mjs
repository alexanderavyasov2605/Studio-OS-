import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Explicit subprocesses: Docker pre-deploy does not interpret shell &&.
for (const [entry, args] of [
  ["tsx/cli", ["scripts/check-production.ts"]],
  ["prisma/build/index.js", ["migrate", "deploy"]],
  ["tsx/cli", ["prisma/seed.ts"]],
]) {
  const result = spawnSync(process.execPath, [require.resolve(entry), ...args], { stdio: "inherit", windowsHide: true });
  if (result.error || result.status !== 0) {
    console.error("Release preparation failed; application must not be promoted.");
    process.exit(result.status || 1);
  }
}
console.log("Release preparation completed: configuration, migrations and catalog seed.");
