import "dotenv/config";
import { database } from "../server/database";
import { hashPassword } from "../server/auth/password";
import { normalizeEmail, validEmail } from "../server/auth/service";

async function main() {
  if (process.argv.length > 2) throw new Error("Use environment variables, not command arguments");
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";
  delete process.env.ADMIN_PASSWORD;
  if (!validEmail(email)) throw new Error("Invalid bootstrap configuration");
  const hash = await hashPassword(password);
  const db = database();
  try {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(81730004)::text`;
      if (await tx.adminCredential.count()) throw new Error("Bootstrap is already complete");
      const existing = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "User" WHERE lower(btrim(email)) = ${email} LIMIT 1`;
      if (existing.length) {
        throw new Error("Bootstrap never upgrades an existing account");
      }
      const user = await tx.user.create({ data: { email, roles: ["ADMIN"], permissions: [], adminCredential: { create: { passwordHash: hash } } } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "auth.admin_bootstrap", entityType: "User", entityId: user.id, after: { role: "ADMIN" } } });
    });
    console.log("Initial administrator created. No password or session has been printed.");
  } finally { await db.$disconnect(); }
}
main().catch(() => {
  console.error("Administrator bootstrap failed. Check environment, migrations, password policy and existing staff credentials.");
  process.exitCode = 1;
});
