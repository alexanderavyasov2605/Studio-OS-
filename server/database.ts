import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalDatabase = globalThis as unknown as { studioDatabase?: PrismaClient };
export function database(): PrismaClient {
  if (!globalDatabase.studioDatabase) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Database configuration is required");
    globalDatabase.studioDatabase = new PrismaClient({
      adapter: new PrismaPg({ connectionString, max: 5, connectionTimeoutMillis: 5000, query_timeout: 5000 }),
    });
  }
  return globalDatabase.studioDatabase;
}
