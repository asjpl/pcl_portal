/*
  Warnings:

  - You are about to drop the column `engineNumber` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `fuel` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `transmission` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "engineNumber",
DROP COLUMN "fuel",
DROP COLUMN "seats",
DROP COLUMN "transmission",
ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "regcheckRaw" JSONB;
