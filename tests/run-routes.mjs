import { spawn, spawnSync } from "node:child_process";

const mode = process.argv.includes("--dev") ? "dev" : "start";
const port = mode === "dev" ? "3100" : "3101";
const server = spawn(process.execPath, [
  "scripts/next.mjs",
  mode, ...(mode === "dev" ? ["--webpack"] : []), "--hostname", "127.0.0.1", "--port", port,
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
  const smoke = spawn(process.execPath, [
    "tests/routes-smoke.mjs", `http://127.0.0.1:${port}`,
  ], { stdio: "inherit", windowsHide: true });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { smoke.kill(); reject(new Error("Route checks timed out")); }, 120_000);
    smoke.once("error", (error) => { clearTimeout(timeout); reject(error); });
    smoke.once("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(); else reject(new Error(`Route checks failed: ${code}`));
    });
  });
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
