/*
  Warnings:

  - Added the required column `count` to the `OrderMenu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderMenu" ADD COLUMN     "count" DECIMAL(10,0) NOT NULL;
