-- AlterTable
ALTER TABLE "public"."Record" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Record_position_idx" ON "public"."Record"("position");
