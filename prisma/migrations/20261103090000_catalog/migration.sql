BEGIN;
-- CreateEnum
CREATE TYPE "CalculationMode" AS ENUM ('AUTO_SHEET', 'MANUAL_REQUEST');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "calculationMode" "CalculationMode" NOT NULL DEFAULT 'MANUAL_REQUEST',
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "alt" VARCHAR(200) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMaterial" (
    "productId" UUID NOT NULL,
    "materialId" UUID NOT NULL,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("productId","materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_sortOrder_key" ON "ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductMaterial_materialId_idx" ON "ProductMaterial"("materialId");

-- CreateIndex
CREATE INDEX "Product_isActive_sortOrder_id_idx" ON "Product"("isActive", "sortOrder", "id");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_catalog_bounds" CHECK ("sortOrder" BETWEEN 0 AND 100000 AND revision > 0 AND features IS NOT NULL AND cardinality(features) <= 12);
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_content_bounds" CHECK ("sortOrder" BETWEEN 0 AND 5 AND length(btrim(alt)) > 0 AND length(btrim(url)) > 0);
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductMaterial" ENABLE ROW LEVEL SECURITY;
COMMIT;
