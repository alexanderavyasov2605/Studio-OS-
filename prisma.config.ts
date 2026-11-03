import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Optional until database tooling is used; no connection during dev or build.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
