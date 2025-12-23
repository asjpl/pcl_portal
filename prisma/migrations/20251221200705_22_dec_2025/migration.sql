-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "regcheckVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CustomerEvent_customerId_idx" ON "CustomerEvent"("customerId");

-- CreateIndex
CREATE INDEX "CustomerEvent_type_idx" ON "CustomerEvent"("type");

-- CreateIndex
CREATE INDEX "LateFee_leaseId_idx" ON "LateFee"("leaseId");

-- CreateIndex
CREATE INDEX "Lease_customerId_idx" ON "Lease"("customerId");

-- CreateIndex
CREATE INDEX "Lease_vehicleId_idx" ON "Lease"("vehicleId");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE INDEX "PaymentAttempt_paymentId_idx" ON "PaymentAttempt"("paymentId");

-- CreateIndex
CREATE INDEX "SmsMessage_customerId_idx" ON "SmsMessage"("customerId");

-- CreateIndex
CREATE INDEX "SmsMessage_sentAt_idx" ON "SmsMessage"("sentAt");

-- CreateIndex
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");
