-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tempPasswordIssuedAt" TIMESTAMP(3);
