import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv.includes("--dev") ? "dev" : "start";
const port = mode === "dev" ? "3100" : "3101";
const server = spawn(process.execPath, [
  fileURLToPath(import.meta.resolve("next/dist/bin/next")),
  mode, "--hostname", "127.0.0.1", "--port", port,
], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let output = "";

try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Next.js startup timed out")), 60_000);
    const onData = (data) => {
      output += data.toString();
      if (output.includes("Ready in")) {
        clearTimeout(timeout);
        resolve();
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.once("error", (error) => { clearTimeout(timeout); reject(error); });
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Next.js exited before readiness: ${code}`));
    });
  });
  const smoke = spawnSync(process.execPath, [
    "tests/routes-smoke.mjs", `http://127.0.0.1:${port}`,
  ], { stdio: "inherit", windowsHide: true, timeout: 120_000 });
  if (smoke.error) throw smoke.error;
  if (smoke.status !== 0) throw new Error(`Route checks failed: ${smoke.status}`);
  console.log(`PASS Next.js ${mode} startup and all route checks`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore", windowsHide: true, timeout: 5_000,
    });
  }
  server.kill("SIGTERM");
  server.stdout.destroy();
  server.stderr.destroy();
  server.unref();
}
