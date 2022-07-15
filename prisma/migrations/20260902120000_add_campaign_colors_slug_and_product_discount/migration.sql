-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "slug" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "textColor" TEXT DEFAULT '#ffffff';
ALTER TABLE "campaigns" ADD COLUMN "glowColor" TEXT;

-- AlterTable
ALTER TABLE "campaign_products" ADD COLUMN "discountType" TEXT;
ALTER TABLE "campaign_products" ADD COLUMN "discountValue" REAL;

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
