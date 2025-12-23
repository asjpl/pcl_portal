/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addressLine1` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driversLicenceExpiry` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driversLicenceNumber` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driversLicenceState` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postcode` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suburb` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "addressLine1" TEXT NOT NULL,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "driversLicenceExpiry" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "driversLicenceNumber" TEXT NOT NULL,
ADD COLUMN     "driversLicenceState" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "postcode" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "suburb" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "PaymentSchedule_leaseId_idx" ON "PaymentSchedule"("leaseId");

-- CreateIndex
CREATE INDEX "PaymentSchedule_dueDate_idx" ON "PaymentSchedule"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentSchedule_status_idx" ON "PaymentSchedule"("status");
