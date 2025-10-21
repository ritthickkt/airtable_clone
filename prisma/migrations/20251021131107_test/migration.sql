/*
  Warnings:

  - You are about to drop the column `position` on the `Record` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Record_tableId_position_idx";

-- AlterTable
ALTER TABLE "public"."Record" DROP COLUMN "position";
