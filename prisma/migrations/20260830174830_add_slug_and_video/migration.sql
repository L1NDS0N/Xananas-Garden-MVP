-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "price" REAL,
    "note" TEXT,
    "amount" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("amount", "categoryId", "createdAt", "description", "id", "name", "note", "price", "published", "updatedAt") SELECT "amount", "categoryId", "createdAt", "description", "id", "name", "note", "price", "published", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
