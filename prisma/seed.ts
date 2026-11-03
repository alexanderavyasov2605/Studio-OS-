import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../server/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for db:seed");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  await prisma.$transaction(async (tx) => {
    for (const format of [
      { code: "A4", name: "A4", widthMm: "210", heightMm: "297" },
      { code: "A3", name: "A3", widthMm: "297", heightMm: "420" },
    ]) {
      await tx.sheetFormat.upsert({
        where: { code: format.code },
        update: {},
        create: { ...format, isCustom: false },
      });
    }
    for (const material of [
      { code: "DEMO_PAPER_STICKER", name: "Пример: бумажная самоклейка" },
      { code: "DEMO_WHITE_FILM", name: "Пример: белая плёнка" },
      { code: "DEMO_TAG_CARD", name: "Пример: картон для бирок" },
    ]) {
      await tx.material.upsert({
        where: { code: material.code },
        update: {},
        create: {
          ...material,
          availability: "UNAVAILABLE",
          description: "Демонстрационный справочник. Требует подтверждения поставщика и технологии.",
          properties: { demo: true, supplierConfirmationRequired: true },
        },
      });
    }
  });
  console.log("Reference seed complete: A4/A3 and three unavailable demo materials. Existing rows unchanged.");
} finally {
  await prisma.$disconnect();
}
