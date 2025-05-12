/*
  Warnings:

  - Added the required column `stock` to the `Menu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "stock" DECIMAL(10,0) NOT NULL;
