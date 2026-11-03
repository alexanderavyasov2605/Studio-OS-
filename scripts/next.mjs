import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
if (process.platform === "win32") {
  const preload = fileURLToPath(new URL("./next-windows-fs.cjs", import.meta.url));
  require(preload);
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --require="${preload.replaceAll("\\", "/")}"`.trim();
}
const cli = require.resolve("next/dist/bin/next");
process.argv = [process.execPath, cli, ...process.argv.slice(2)];
await import(pathToFileURL(cli).href);
