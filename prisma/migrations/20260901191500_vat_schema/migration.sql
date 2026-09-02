-- Legacy Invoice rows are month markers without VAT data; they cannot be
-- backfilled once VAT columns become NOT NULL. Remove only Invoice records;
-- Account, Customer, Manager, and Notification data are preserved.
DELETE FROM "Invoice";

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "VatRate" AS ENUM ('VAT_23', 'VAT_8', 'VAT_5', 'VAT_0', 'EXEMPT');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_VERIFIED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "grossAmount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "issueDate" DATE NOT NULL,
ADD COLUMN     "netAmount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "saleDate" DATE NOT NULL,
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
ADD COLUMN     "vatAmount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByAccountId" TEXT;

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bankAccountNumber" TEXT,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "email" TEXT,
    "phone" TEXT,
    "bankAccountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSeller" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bankAccountNumber" TEXT,

    CONSTRAINT "InvoiceSeller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceBuyer" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "InvoiceBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitNetPrice" DECIMAL(14,2) NOT NULL,
    "vatRate" "VatRate" NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_customerId_key" ON "SellerProfile"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_nip_key" ON "SellerProfile"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_nip_key" ON "Contractor"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSeller_invoiceId_key" ON "InvoiceSeller"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBuyer_invoiceId_key" ON "InvoiceBuyer"("invoiceId");

-- CreateIndex
CREATE INDEX "ActivityLog_accountId_createdAt_idx" ON "ActivityLog"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_customerId_invoiceNumber_key" ON "Invoice"("customerId", "invoiceNumber");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_verifiedByAccountId_fkey" FOREIGN KEY ("verifiedByAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSeller" ADD CONSTRAINT "InvoiceSeller_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBuyer" ADD CONSTRAINT "InvoiceBuyer_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBuyer" ADD CONSTRAINT "InvoiceBuyer_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
