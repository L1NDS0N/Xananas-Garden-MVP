/*
  Warnings:

  - Added the required column `image` to the `product_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_images` ADD COLUMN `image` VARCHAR(191) NOT NULL;
