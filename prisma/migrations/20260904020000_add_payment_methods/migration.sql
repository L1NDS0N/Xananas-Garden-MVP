-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "maxInstallments" INTEGER NOT NULL DEFAULT 1,
    "adjustmentType" TEXT,
    "adjustmentValueType" TEXT,
    "adjustmentValue" REAL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_key_key" ON "payment_methods"("key");

-- CreateTable
CREATE TABLE "product_payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_payment_methods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_payment_methods_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "product_payment_methods_productId_paymentMethodId_key" ON "product_payment_methods"("productId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "product_payment_methods_paymentMethodId_idx" ON "product_payment_methods"("paymentMethodId");

-- Seed the 4 built-in payment types this app already used as hardcoded options,
-- so existing sales' paymentType values ("money"/"card"/"pix"/"other") keep resolving.
INSERT INTO "payment_methods" ("id", "key", "name", "active", "isDefault", "maxInstallments", "order", "createdAt", "updatedAt") VALUES
  ('7cd67d4f-ec33-47b7-b125-89f945466042', 'money', 'Dinheiro', true, true, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('aae2fe4a-fd69-48d5-8cab-a54af4465a73', 'card', 'Cartão', true, true, 12, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11a2b2e6-eee2-447a-9614-9a00cbb43a92', 'pix', 'PIX', true, true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('26fe7546-5d85-402d-8cf9-9cbc3b87812a', 'other', 'Outros', true, true, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
