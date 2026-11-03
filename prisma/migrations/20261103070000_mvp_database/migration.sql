BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'MANAGER', 'DESIGNER', 'PRODUCTION', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('WEBSITE', 'TELEGRAM', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialAvailability" AS ENUM ('AVAILABLE', 'ON_REQUEST', 'UNAVAILABLE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('SHEET', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PrintSides" AS ENUM ('SINGLE', 'DOUBLE');

-- CreateEnum
CREATE TYPE "PriceListStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "OperationUnit" AS ENUM ('PER_ORDER', 'PER_SHEET', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'READY', 'MANUAL_REVIEW', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('FIRM', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "QuantityMode" AS ENUM ('UNITS', 'SHEETS');

-- CreateEnum
CREATE TYPE "ArtworkService" AS ENUM ('PROVIDED', 'ADAPTATION', 'DESIGN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_REVIEW', 'QUOTED', 'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'COMPLETED', 'NEEDS_ARTWORK', 'AWAITING_ARTWORK_APPROVAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('MISSING', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "FileCheckStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'PROVIDER', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('QUEUED', 'PREPARATION', 'PRINT', 'FINISHING', 'QUALITY_CHECK', 'READY');

-- CreateEnum
CREATE TYPE "ProductionJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusEntity" AS ENUM ('ORDER', 'ORDER_ITEM', 'ARTWORK', 'PAYMENT', 'PRODUCTION_JOB');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254),
    "displayName" VARCHAR(200),
    "locale" VARCHAR(10) NOT NULL DEFAULT 'ru',
    "roles" "Role"[] DEFAULT ARRAY['CLIENT']::"Role"[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "externalAuthId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramIdentity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "username" VARCHAR(64),
    "linkedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "companyName" VARCHAR(200),
    "email" VARCHAR(254),
    "phone" VARCHAR(32),
    "source" "CustomerSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "parentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "kind" "ProductKind" NOT NULL DEFAULT 'SHEET',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "configurationSchema" JSONB NOT NULL DEFAULT '{}',
    "artworkApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeDays" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "densityGsm" DECIMAL(10,3),
    "thicknessMm" DECIMAL(10,3),
    "properties" JSONB NOT NULL DEFAULT '{}',
    "availability" "MaterialAvailability" NOT NULL DEFAULT 'UNAVAILABLE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetFormat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "widthMm" DECIMAL(10,3) NOT NULL,
    "heightMm" DECIMAL(10,3) NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sheetFormatId" UUID NOT NULL,
    "workWidthMm" DECIMAL(10,3) NOT NULL,
    "workHeightMm" DECIMAL(10,3) NOT NULL,
    "marginTopMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "marginBottomMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "marginLeftMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "marginRightMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "gapXMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "gapYMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "bleedMm" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "allowRotation" BOOLEAN NOT NULL DEFAULT false,
    "setupSheets" INTEGER NOT NULL DEFAULT 0,
    "wastePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "constraints" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCompatibility" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "productionProfileId" UUID NOT NULL,
    "allowedSides" "PrintSides"[] DEFAULT ARRAY['SINGLE']::"PrintSides"[],
    "operationCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "series" VARCHAR(64) NOT NULL DEFAULT 'standard',
    "version" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UZS',
    "status" "PriceListStatus" NOT NULL DEFAULT 'DRAFT',
    "validFrom" TIMESTAMPTZ(3) NOT NULL,
    "validUntil" TIMESTAMPTZ(3),
    "publishedAt" TIMESTAMPTZ(3),
    "minimumOrderPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "roundingIncrement" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "reservePolicy" JSONB NOT NULL DEFAULT '{"billable":"sellable_sheets","reserveIncluded":true}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceListVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetTariff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "priceListVersionId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "productionProfileId" UUID NOT NULL,
    "sides" "PrintSides" NOT NULL DEFAULT 'SINGLE',
    "pricePerSheet" DECIMAL(18,4) NOT NULL,
    "includesMaterial" BOOLEAN NOT NULL DEFAULT true,
    "includesPrinting" BOOLEAN NOT NULL DEFAULT true,
    "minimumItemPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sheetTariffId" UUID NOT NULL,
    "fromSheets" INTEGER NOT NULL,
    "toSheets" INTEGER,
    "pricePerSheet" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTariff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "priceListVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit" "OperationUnit" NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "compatibility" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OperationTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetTariffIncludedOperation" (
    "sheetTariffId" UUID NOT NULL,
    "operationTariffId" UUID NOT NULL,
    "priceListVersionId" UUID NOT NULL,

    CONSTRAINT "SheetTariffIncludedOperation_pkey" PRIMARY KEY ("sheetTariffId","operationTariffId")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID,
    "createdById" UUID,
    "priceListVersionId" UUID,
    "currency" CHAR(3) NOT NULL DEFAULT 'UZS',
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "priceStatus" "PriceStatus" NOT NULL DEFAULT 'MANUAL_REVIEW',
    "calculationVersion" VARCHAR(64) NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "priceSnapshot" JSONB,
    "total" DECIMAL(18,2),
    "manualReason" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quoteId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" UUID,
    "materialId" UUID,
    "sheetFormatId" UUID,
    "productionProfileId" UUID,
    "inputSnapshot" JSONB NOT NULL,
    "calculationSnapshot" JSONB,
    "priceSnapshot" JSONB,
    "total" DECIMAL(18,2),

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "number" BIGSERIAL NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "customerId" UUID,
    "managerId" UUID,
    "quoteId" UUID,
    "priceListVersionId" UUID,
    "currency" CHAR(3) NOT NULL DEFAULT 'UZS',
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "customerSnapshot" JSONB NOT NULL,
    "configurationSnapshot" JSONB NOT NULL,
    "priceSnapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deliveryAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "fulfillment" JSONB NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "termsAcceptedAt" TIMESTAMPTZ(3),
    "dueAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "quoteItemId" UUID,
    "productId" UUID,
    "materialId" UUID,
    "sheetFormatId" UUID,
    "productionProfileId" UUID,
    "quantityMode" "QuantityMode" NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "widthMm" DECIMAL(10,3),
    "heightMm" DECIMAL(10,3),
    "capacityPerSheet" INTEGER,
    "nominalUnits" INTEGER,
    "sellableSheets" INTEGER,
    "billableSheets" INTEGER,
    "productionSheets" INTEGER,
    "sides" "PrintSides" NOT NULL DEFAULT 'SINGLE',
    "artworkService" "ArtworkService" NOT NULL DEFAULT 'PROVIDED',
    "artworkApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "configurationSnapshot" JSONB NOT NULL,
    "calculationSnapshot" JSONB NOT NULL,
    "priceSnapshot" JSONB NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID,
    "orderItemId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "status" "ArtworkStatus" NOT NULL DEFAULT 'MISSING',
    "approvedVersionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artworkId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "storageBucket" VARCHAR(100) NOT NULL DEFAULT 'artwork',
    "sourceObjectKey" VARCHAR(1024) NOT NULL,
    "previewObjectKey" VARCHAR(1024),
    "originalFilename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" CHAR(64),
    "pixelWidth" INTEGER,
    "pixelHeight" INTEGER,
    "pageCount" INTEGER,
    "fileCheckStatus" "FileCheckStatus" NOT NULL DEFAULT 'PENDING',
    "reviewStatus" "ArtworkStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "uploadedById" UUID,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UZS',
    "kind" "PaymentKind" NOT NULL DEFAULT 'PAYMENT',
    "amount" DECIMAL(18,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(64),
    "externalId" VARCHAR(200),
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "evidenceObjectKey" VARCHAR(1024),
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderItemId" UUID NOT NULL,
    "artworkVersionId" UUID,
    "productionProfileId" UUID,
    "assigneeId" UUID,
    "stage" "ProductionStage" NOT NULL DEFAULT 'QUEUED',
    "status" "ProductionJobStatus" NOT NULL DEFAULT 'PENDING',
    "specificationSnapshot" JSONB NOT NULL,
    "productionSheets" INTEGER NOT NULL,
    "goodUnits" INTEGER NOT NULL DEFAULT 0,
    "defectUnits" INTEGER NOT NULL DEFAULT 0,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "dueAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity" "StatusEntity" NOT NULL,
    "field" VARCHAR(64) NOT NULL DEFAULT 'status',
    "orderId" UUID,
    "orderItemId" UUID,
    "artworkId" UUID,
    "paymentId" UUID,
    "productionJobId" UUID,
    "fromStatus" VARCHAR(64),
    "toStatus" VARCHAR(64) NOT NULL,
    "reason" TEXT,
    "actorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(64) NOT NULL,
    "entityId" UUID,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramIdentity_userId_key" ON "TelegramIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramIdentity_telegramUserId_key" ON "TelegramIdentity"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_source_createdAt_idx" ON "Customer"("source", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Customer_archivedAt_name_idx" ON "Customer"("archivedAt", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Material_availability_name_idx" ON "Material"("availability", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SheetFormat_code_key" ON "SheetFormat"("code");

-- CreateIndex
CREATE INDEX "SheetFormat_widthMm_heightMm_idx" ON "SheetFormat"("widthMm", "heightMm");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionProfile_code_key" ON "ProductionProfile"("code");

-- CreateIndex
CREATE INDEX "ProductionProfile_sheetFormatId_isActive_idx" ON "ProductionProfile"("sheetFormatId", "isActive");

-- CreateIndex
CREATE INDEX "ProductCompatibility_materialId_idx" ON "ProductCompatibility"("materialId");

-- CreateIndex
CREATE INDEX "ProductCompatibility_productionProfileId_idx" ON "ProductCompatibility"("productionProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCompatibility_productId_materialId_productionProfile_key" ON "ProductCompatibility"("productId", "materialId", "productionProfileId");

-- CreateIndex
CREATE INDEX "PriceListVersion_status_validFrom_idx" ON "PriceListVersion"("status", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListVersion_series_version_key" ON "PriceListVersion"("series", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListVersion_id_currency_key" ON "PriceListVersion"("id", "currency");

-- CreateIndex
CREATE INDEX "SheetTariff_materialId_productionProfileId_isActive_idx" ON "SheetTariff"("materialId", "productionProfileId", "isActive");

-- CreateIndex
CREATE INDEX "SheetTariff_productionProfileId_idx" ON "SheetTariff"("productionProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetTariff_priceListVersionId_materialId_productionProfile_key" ON "SheetTariff"("priceListVersionId", "materialId", "productionProfileId", "sides");

-- CreateIndex
CREATE UNIQUE INDEX "SheetTariff_id_priceListVersionId_key" ON "SheetTariff"("id", "priceListVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_sheetTariffId_fromSheets_key" ON "PricingTier"("sheetTariffId", "fromSheets");

-- CreateIndex
CREATE UNIQUE INDEX "OperationTariff_priceListVersionId_code_key" ON "OperationTariff"("priceListVersionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "OperationTariff_id_priceListVersionId_key" ON "OperationTariff"("id", "priceListVersionId");

-- CreateIndex
CREATE INDEX "SheetTariffIncludedOperation_operationTariffId_priceListVer_idx" ON "SheetTariffIncludedOperation"("operationTariffId", "priceListVersionId");

-- CreateIndex
CREATE INDEX "Quote_customerId_createdAt_idx" ON "Quote"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Quote_createdById_idx" ON "Quote"("createdById");

-- CreateIndex
CREATE INDEX "Quote_priceListVersionId_currency_idx" ON "Quote"("priceListVersionId", "currency");

-- CreateIndex
CREATE INDEX "Quote_status_expiresAt_idx" ON "Quote"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");

-- CreateIndex
CREATE INDEX "QuoteItem_materialId_idx" ON "QuoteItem"("materialId");

-- CreateIndex
CREATE INDEX "QuoteItem_sheetFormatId_idx" ON "QuoteItem"("sheetFormatId");

-- CreateIndex
CREATE INDEX "QuoteItem_productionProfileId_idx" ON "QuoteItem"("productionProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_quoteId_position_key" ON "QuoteItem"("quoteId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_quoteId_key" ON "Order"("quoteId");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_managerId_status_idx" ON "Order"("managerId", "status");

-- CreateIndex
CREATE INDEX "Order_priceListVersionId_currency_idx" ON "Order"("priceListVersionId", "currency");

-- CreateIndex
CREATE INDEX "Order_status_dueAt_idx" ON "Order"("status", "dueAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_currency_key" ON "Order"("id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_quoteItemId_key" ON "OrderItem"("quoteItemId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_materialId_idx" ON "OrderItem"("materialId");

-- CreateIndex
CREATE INDEX "OrderItem_sheetFormatId_idx" ON "OrderItem"("sheetFormatId");

-- CreateIndex
CREATE INDEX "OrderItem_productionProfileId_idx" ON "OrderItem"("productionProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_position_key" ON "OrderItem"("orderId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Artwork_orderItemId_key" ON "Artwork"("orderItemId");

-- CreateIndex
CREATE INDEX "Artwork_customerId_idx" ON "Artwork"("customerId");

-- CreateIndex
CREATE INDEX "Artwork_status_updatedAt_idx" ON "Artwork"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Artwork_approvedVersionId_id_idx" ON "Artwork"("approvedVersionId", "id");

-- CreateIndex
CREATE INDEX "ArtworkVersion_uploadedById_idx" ON "ArtworkVersion"("uploadedById");

-- CreateIndex
CREATE INDEX "ArtworkVersion_approvedById_idx" ON "ArtworkVersion"("approvedById");

-- CreateIndex
CREATE INDEX "ArtworkVersion_fileCheckStatus_createdAt_idx" ON "ArtworkVersion"("fileCheckStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkVersion_artworkId_version_key" ON "ArtworkVersion"("artworkId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkVersion_id_artworkId_key" ON "ArtworkVersion"("id", "artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkVersion_storageBucket_sourceObjectKey_key" ON "ArtworkVersion"("storageBucket", "sourceObjectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_orderId_currency_status_idx" ON "Payment"("orderId", "currency", "status");

-- CreateIndex
CREATE INDEX "Payment_verifiedById_idx" ON "Payment"("verifiedById");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_externalId_key" ON "Payment"("provider", "externalId");

-- CreateIndex
CREATE INDEX "ProductionJob_stage_status_dueAt_idx" ON "ProductionJob"("stage", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ProductionJob_assigneeId_status_idx" ON "ProductionJob"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "ProductionJob_orderItemId_idx" ON "ProductionJob"("orderItemId");

-- CreateIndex
CREATE INDEX "ProductionJob_artworkVersionId_idx" ON "ProductionJob"("artworkVersionId");

-- CreateIndex
CREATE INDEX "ProductionJob_productionProfileId_idx" ON "ProductionJob"("productionProfileId");

-- CreateIndex
CREATE INDEX "StatusHistory_orderId_createdAt_idx" ON "StatusHistory"("orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StatusHistory_orderItemId_createdAt_idx" ON "StatusHistory"("orderItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StatusHistory_artworkId_createdAt_idx" ON "StatusHistory"("artworkId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StatusHistory_paymentId_createdAt_idx" ON "StatusHistory"("paymentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StatusHistory_productionJobId_createdAt_idx" ON "StatusHistory"("productionJobId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StatusHistory_actorId_idx" ON "StatusHistory"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TelegramIdentity" ADD CONSTRAINT "TelegramIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionProfile" ADD CONSTRAINT "ProductionProfile_sheetFormatId_fkey" FOREIGN KEY ("sheetFormatId") REFERENCES "SheetFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productionProfileId_fkey" FOREIGN KEY ("productionProfileId") REFERENCES "ProductionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetTariff" ADD CONSTRAINT "SheetTariff_priceListVersionId_fkey" FOREIGN KEY ("priceListVersionId") REFERENCES "PriceListVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetTariff" ADD CONSTRAINT "SheetTariff_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetTariff" ADD CONSTRAINT "SheetTariff_productionProfileId_fkey" FOREIGN KEY ("productionProfileId") REFERENCES "ProductionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_sheetTariffId_fkey" FOREIGN KEY ("sheetTariffId") REFERENCES "SheetTariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTariff" ADD CONSTRAINT "OperationTariff_priceListVersionId_fkey" FOREIGN KEY ("priceListVersionId") REFERENCES "PriceListVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetTariffIncludedOperation" ADD CONSTRAINT "SheetTariffIncludedOperation_sheetTariffId_priceListVersio_fkey" FOREIGN KEY ("sheetTariffId", "priceListVersionId") REFERENCES "SheetTariff"("id", "priceListVersionId") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SheetTariffIncludedOperation" ADD CONSTRAINT "SheetTariffIncludedOperation_operationTariffId_priceListVe_fkey" FOREIGN KEY ("operationTariffId", "priceListVersionId") REFERENCES "OperationTariff"("id", "priceListVersionId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_priceListVersionId_currency_fkey" FOREIGN KEY ("priceListVersionId", "currency") REFERENCES "PriceListVersion"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_sheetFormatId_fkey" FOREIGN KEY ("sheetFormatId") REFERENCES "SheetFormat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productionProfileId_fkey" FOREIGN KEY ("productionProfileId") REFERENCES "ProductionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_priceListVersionId_currency_fkey" FOREIGN KEY ("priceListVersionId", "currency") REFERENCES "PriceListVersion"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sheetFormatId_fkey" FOREIGN KEY ("sheetFormatId") REFERENCES "SheetFormat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productionProfileId_fkey" FOREIGN KEY ("productionProfileId") REFERENCES "ProductionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_approvedVersionId_id_fkey" FOREIGN KEY ("approvedVersionId", "id") REFERENCES "ArtworkVersion"("id", "artworkId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ArtworkVersion" ADD CONSTRAINT "ArtworkVersion_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkVersion" ADD CONSTRAINT "ArtworkVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkVersion" ADD CONSTRAINT "ArtworkVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_currency_fkey" FOREIGN KEY ("orderId", "currency") REFERENCES "Order"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_artworkVersionId_fkey" FOREIGN KEY ("artworkVersionId") REFERENCES "ArtworkVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_productionProfileId_fkey" FOREIGN KEY ("productionProfileId") REFERENCES "ProductionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_productionJobId_fkey" FOREIGN KEY ("productionJobId") REFERENCES "ProductionJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Additional PostgreSQL invariants not expressible in Prisma schema.
ALTER TABLE "TelegramIdentity" ADD CONSTRAINT "TelegramIdentity_data_check" CHECK ("telegramUserId" > 0);
ALTER TABLE "User" ADD CONSTRAINT "User_data_check" CHECK (cardinality("roles") > 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_data_check" CHECK ("leadTimeDays" IS NULL OR "leadTimeDays" >= 0);
ALTER TABLE "Material" ADD CONSTRAINT "Material_data_check" CHECK (("densityGsm" IS NULL OR "densityGsm" > 0) AND ("thicknessMm" IS NULL OR "thicknessMm" > 0) AND jsonb_typeof("properties") = 'object');
ALTER TABLE "SheetFormat" ADD CONSTRAINT "SheetFormat_data_check" CHECK ("widthMm" > 0 AND "heightMm" > 0);
ALTER TABLE "ProductionProfile" ADD CONSTRAINT "ProductionProfile_data_check" CHECK ("workWidthMm" > 0 AND "workHeightMm" > 0 AND "marginTopMm" >= 0 AND "marginBottomMm" >= 0 AND "marginLeftMm" >= 0 AND "marginRightMm" >= 0 AND "gapXMm" >= 0 AND "gapYMm" >= 0 AND "bleedMm" >= 0 AND "setupSheets" >= 0 AND "wastePercent" BETWEEN 0 AND 100 AND jsonb_typeof("constraints") = 'object');
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_data_check" CHECK (cardinality("allowedSides") > 0);
ALTER TABLE "PriceListVersion" ADD CONSTRAINT "PriceListVersion_data_check" CHECK ("version" > 0 AND "minimumOrderPrice" >= 0 AND "roundingIncrement" > 0 AND "currency" ~ '^[A-Z]{3}$' AND ("validUntil" IS NULL OR "validUntil" > "validFrom") AND ("status" = 'DRAFT' OR "publishedAt" IS NOT NULL));
ALTER TABLE "SheetTariff" ADD CONSTRAINT "SheetTariff_data_check" CHECK ("pricePerSheet" >= 0 AND "minimumItemPrice" >= 0);
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_data_check" CHECK ("fromSheets" > 0 AND ("toSheets" IS NULL OR "toSheets" >= "fromSheets") AND "pricePerSheet" >= 0);
ALTER TABLE "OperationTariff" ADD CONSTRAINT "OperationTariff_data_check" CHECK ("price" >= 0 AND jsonb_typeof("compatibility") = 'object');
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_data_check" CHECK ("currency" ~ '^[A-Z]{3}$' AND jsonb_typeof("inputSnapshot") = 'object' AND "inputSnapshot" <> '{}'::jsonb AND ("total" IS NULL OR "total" >= 0) AND "expiresAt" > "createdAt" AND ("priceStatus" <> 'FIRM' OR ("total" IS NOT NULL AND "priceListVersionId" IS NOT NULL AND "priceSnapshot" IS NOT NULL AND jsonb_typeof("priceSnapshot") = 'object' AND "priceSnapshot" <> '{}'::jsonb)) AND ("status" NOT IN ('READY', 'ACCEPTED') OR ("total" IS NOT NULL AND "priceSnapshot" IS NOT NULL)));
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_data_check" CHECK ("position" > 0 AND jsonb_typeof("inputSnapshot") = 'object' AND "inputSnapshot" <> '{}'::jsonb AND ("total" IS NULL OR "total" >= 0));
ALTER TABLE "Order" ADD CONSTRAINT "Order_data_check" CHECK ("currency" ~ '^[A-Z]{3}$' AND "subtotal" >= 0 AND "discountAmount" >= 0 AND "deliveryAmount" >= 0 AND "total" >= 0 AND "discountAmount" <= "subtotal" AND "total" = "subtotal" - "discountAmount" + "deliveryAmount" AND jsonb_typeof("customerSnapshot") = 'object' AND "customerSnapshot" <> '{}'::jsonb AND jsonb_typeof("configurationSnapshot") = 'object' AND "configurationSnapshot" <> '{}'::jsonb AND jsonb_typeof("priceSnapshot") = 'object' AND "priceSnapshot" <> '{}'::jsonb);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_data_check" CHECK ("position" > 0 AND "requestedQuantity" > 0 AND "lineTotal" >= 0 AND (("widthMm" IS NULL AND "heightMm" IS NULL) OR ("widthMm" > 0 AND "heightMm" > 0 AND "widthMm" IS NOT NULL AND "heightMm" IS NOT NULL)) AND ("capacityPerSheet" IS NULL OR "capacityPerSheet" > 0) AND ("nominalUnits" IS NULL OR "nominalUnits" > 0) AND ("sellableSheets" IS NULL OR "sellableSheets" > 0) AND ("billableSheets" IS NULL OR "billableSheets" > 0) AND ("productionSheets" IS NULL OR "productionSheets" > 0) AND ("productionSheets" IS NULL OR "sellableSheets" IS NULL OR "productionSheets" >= "sellableSheets") AND jsonb_typeof("configurationSnapshot") = 'object' AND "configurationSnapshot" <> '{}'::jsonb AND jsonb_typeof("calculationSnapshot") = 'object' AND "calculationSnapshot" <> '{}'::jsonb AND jsonb_typeof("priceSnapshot") = 'object' AND "priceSnapshot" <> '{}'::jsonb);
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_data_check" CHECK (("status" = 'APPROVED') = ("approvedVersionId" IS NOT NULL));
ALTER TABLE "ArtworkVersion" ADD CONSTRAINT "ArtworkVersion_data_check" CHECK ("version" > 0 AND "sizeBytes" > 0 AND length("sourceObjectKey") > 0 AND ("pixelWidth" IS NULL OR "pixelWidth" > 0) AND ("pixelHeight" IS NULL OR "pixelHeight" > 0) AND ("pageCount" IS NULL OR "pageCount" > 0) AND ("sha256" IS NULL OR "sha256" ~ '^[a-f0-9]{64}$') AND ("reviewStatus" <> 'APPROVED' OR ("approvedAt" IS NOT NULL AND "fileCheckStatus" = 'VALID')));
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_data_check" CHECK ("amount" > 0 AND "currency" ~ '^[A-Z]{3}$' AND (("provider" IS NULL) = ("externalId" IS NULL)) AND ("method" <> 'PROVIDER' OR "provider" IS NOT NULL) AND ("status" <> 'CONFIRMED' OR "verifiedAt" IS NOT NULL));
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_data_check" CHECK ("productionSheets" > 0 AND "goodUnits" >= 0 AND "defectUnits" >= 0 AND jsonb_typeof("specificationSnapshot") = 'object' AND "specificationSnapshot" <> '{}'::jsonb AND ("completedAt" IS NULL OR "startedAt" IS NULL OR "completedAt" >= "startedAt"));
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_data_check" CHECK (num_nonnulls("orderId", "orderItemId", "artworkId", "paymentId", "productionJobId") = 1 AND (("entity" = 'ORDER' AND "orderId" IS NOT NULL) OR ("entity" = 'ORDER_ITEM' AND "orderItemId" IS NOT NULL) OR ("entity" = 'ARTWORK' AND "artworkId" IS NOT NULL) OR ("entity" = 'PAYMENT' AND "paymentId" IS NOT NULL) OR ("entity" = 'PRODUCTION_JOB' AND "productionJobId" IS NOT NULL)) AND length("toStatus") > 0);

-- Published/retired price lists retain their commercial data. New rates require a new draft version.
CREATE FUNCTION studio_assert_draft_price_list(version_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE state "PriceListStatus";
BEGIN
  SELECT "status" INTO state FROM "PriceListVersion" WHERE id = version_id FOR SHARE;
  IF state IS NOT NULL AND state <> 'DRAFT' THEN
    RAISE EXCEPTION 'Published price-list rates are immutable' USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE FUNCTION studio_guard_rates() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN PERFORM studio_assert_draft_price_list(OLD."priceListVersionId"); END IF;
  IF TG_OP <> 'DELETE' THEN PERFORM studio_assert_draft_price_list(NEW."priceListVersionId"); END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION studio_guard_price_list() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status" <> 'DRAFT' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Archive a published price list; do not delete it' USING ERRCODE = '23514';
    END IF;
    IF (to_jsonb(NEW) - ARRAY['status','validUntil','updatedAt']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status','validUntil','updatedAt'])
       OR (NEW."status" <> OLD."status" AND NOT (OLD."status" = 'PUBLISHED' AND NEW."status" = 'RETIRED')) THEN
      RAISE EXCEPTION 'Create a new price-list version instead of modifying published data' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "PriceListVersion_immutable" BEFORE UPDATE OR DELETE ON "PriceListVersion"
FOR EACH ROW EXECUTE FUNCTION studio_guard_price_list();
CREATE TRIGGER "SheetTariff_draft_only" BEFORE INSERT OR UPDATE OR DELETE ON "SheetTariff" FOR EACH ROW EXECUTE FUNCTION studio_guard_rates();
CREATE TRIGGER "OperationTariff_draft_only" BEFORE INSERT OR UPDATE OR DELETE ON "OperationTariff" FOR EACH ROW EXECUTE FUNCTION studio_guard_rates();
CREATE TRIGGER "SheetTariffIncludedOperation_draft_only" BEFORE INSERT OR UPDATE OR DELETE ON "SheetTariffIncludedOperation" FOR EACH ROW EXECUTE FUNCTION studio_guard_rates();

CREATE FUNCTION studio_guard_tier() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE list_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT "priceListVersionId" INTO list_id FROM "SheetTariff" WHERE id = OLD."sheetTariffId";
    PERFORM studio_assert_draft_price_list(list_id);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT "priceListVersionId" INTO list_id FROM "SheetTariff" WHERE id = NEW."sheetTariffId";
    PERFORM studio_assert_draft_price_list(list_id);
    IF TG_OP = 'UPDATE' AND NEW."sheetTariffId" <> OLD."sheetTariffId" THEN
      RAISE EXCEPTION 'Create a new tier instead of changing its tariff' USING ERRCODE = '23514';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW."sheetTariffId"::text, 8173));
    IF EXISTS (
      SELECT 1 FROM "PricingTier" t WHERE t."sheetTariffId" = NEW."sheetTariffId" AND t.id <> NEW.id
      AND int8range(t."fromSheets"::bigint, CASE WHEN t."toSheets" IS NULL THEN NULL ELSE t."toSheets"::bigint + 1 END, '[)') &&
          int8range(NEW."fromSheets"::bigint, CASE WHEN NEW."toSheets" IS NULL THEN NULL ELSE NEW."toSheets"::bigint + 1 END, '[)')
    ) THEN RAISE EXCEPTION 'Sheet-count pricing tiers must not overlap' USING ERRCODE = '23514'; END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "PricingTier_guard" BEFORE INSERT OR UPDATE OR DELETE ON "PricingTier"
FOR EACH ROW EXECUTE FUNCTION studio_guard_tier();

CREATE FUNCTION studio_check_profile_bounds() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fmt "SheetFormat";
BEGIN
  SELECT * INTO fmt FROM "SheetFormat" WHERE id = NEW."sheetFormatId" FOR SHARE;
  IF NEW."workWidthMm" + NEW."marginLeftMm" + NEW."marginRightMm" > fmt."widthMm"
     OR NEW."workHeightMm" + NEW."marginTopMm" + NEW."marginBottomMm" > fmt."heightMm" THEN
    RAISE EXCEPTION 'Working area plus margins exceeds physical sheet' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ProductionProfile_bounds" BEFORE INSERT OR UPDATE ON "ProductionProfile"
FOR EACH ROW EXECUTE FUNCTION studio_check_profile_bounds();

CREATE FUNCTION studio_check_format_bounds() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ProductionProfile" p WHERE p."sheetFormatId" = NEW.id AND
    (p."workWidthMm" + p."marginLeftMm" + p."marginRightMm" > NEW."widthMm"
     OR p."workHeightMm" + p."marginTopMm" + p."marginBottomMm" > NEW."heightMm")) THEN
    RAISE EXCEPTION 'Sheet dimensions invalidate an existing production profile' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SheetFormat_bounds" BEFORE UPDATE ON "SheetFormat"
FOR EACH ROW EXECUTE FUNCTION studio_check_format_bounds();

-- Version ownership is checked independently of API authorization.
CREATE FUNCTION studio_check_job_artwork() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."artworkVersionId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "ArtworkVersion" v JOIN "Artwork" a ON a.id = v."artworkId"
    WHERE v.id = NEW."artworkVersionId" AND a."orderItemId" = NEW."orderItemId"
  ) THEN RAISE EXCEPTION 'Artwork version belongs to another order item' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ProductionJob_artwork_owner" BEFORE INSERT OR UPDATE ON "ProductionJob"
FOR EACH ROW EXECUTE FUNCTION studio_check_job_artwork();

-- No anonymous/authenticated table policies at this stage: all access is through the future backend.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SheetFormat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductionProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductCompatibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceListVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SheetTariff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OperationTariff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SheetTariffIncludedOperation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Artwork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArtworkVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductionJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Quote" ADD CONSTRAINT "Quote_optional_snapshot_check" CHECK
  ("priceSnapshot" IS NULL OR (jsonb_typeof("priceSnapshot") = 'object' AND "priceSnapshot" <> '{}'::jsonb));
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_optional_snapshot_check" CHECK
  (("calculationSnapshot" IS NULL OR jsonb_typeof("calculationSnapshot") = 'object')
  AND ("priceSnapshot" IS NULL OR jsonb_typeof("priceSnapshot") = 'object'));

CREATE UNIQUE INDEX "User_email_normalized_key" ON "User" (lower(btrim(email))) WHERE email IS NOT NULL;

COMMIT;
