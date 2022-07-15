-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL,
    "imageSm" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_product_images" ("createdAt", "id", "image", "imageSm", "productId", "updatedAt") SELECT "createdAt", "id", "image", "imageSm", "productId", "updatedAt" FROM "product_images";
DROP TABLE "product_images";
ALTER TABLE "new_product_images" RENAME TO "product_images";
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL,
    "note" TEXT,
    "amount" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "videoPosition" INTEGER NOT NULL DEFAULT 99,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("amount", "categoryId", "createdAt", "description", "id", "name", "note", "price", "published", "slug", "updatedAt", "videoUrl") SELECT "amount", "categoryId", "createdAt", "description", "id", "name", "note", "price", "published", "slug", "updatedAt", "videoUrl" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
