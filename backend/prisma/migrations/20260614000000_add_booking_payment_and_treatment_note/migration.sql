CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD');

ALTER TABLE "Booking"
  ADD COLUMN "treatmentNote" TEXT,
  ADD COLUMN "paidAmount"    DECIMAL(65,30),
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "paidAt"        TIMESTAMP(3);
