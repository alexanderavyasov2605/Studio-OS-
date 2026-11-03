import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Optional until database tooling is used; no connection during dev or build.
  datasource: { url: process.env.DATABASE_URL },
});
