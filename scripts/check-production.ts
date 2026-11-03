import "dotenv/config";
import { authenticationOrigin } from "../server/auth/config";
function checkDatabase(value: string | undefined) {
  if (!value) throw new Error("Missing database configuration");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || !url.password) throw new Error("Invalid database configuration");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!local && !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode") ?? "")) throw new Error("Database TLS is required");
}
try {
  if (process.env.NODE_ENV !== "production") throw new Error("Production mode is required");
  authenticationOrigin();
  checkDatabase(process.env.DATABASE_URL);
  if (process.env.DIRECT_URL) checkDatabase(process.env.DIRECT_URL);
  if (process.env.ADMIN_PASSWORD || process.env.ADMIN_EMAIL) throw new Error("Bootstrap credentials must not persist in service variables");
  console.log("Production configuration validated. No secret values printed.");
} catch {
  console.error("Production configuration invalid: check NODE_ENV, HTTPS APP_ORIGIN, database TLS and remove bootstrap variables.");
  process.exitCode = 1;
}
