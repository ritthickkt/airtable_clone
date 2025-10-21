-- AlterTable
ALTER TABLE "public"."Record" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Table" ADD COLUMN     "filterConfig" JSONB,
ADD COLUMN     "sortConfig" JSONB;

-- CreateTable
CREATE TABLE "public"."View" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'grid',
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableId" TEXT NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "View_tableId_idx" ON "public"."View"("tableId");

-- CreateIndex
CREATE INDEX "Record_tableId_position_idx" ON "public"."Record"("tableId", "position");

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
