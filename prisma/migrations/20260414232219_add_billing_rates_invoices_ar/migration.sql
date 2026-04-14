-- CreateEnum
CREATE TYPE "BillingRateType" AS ENUM ('STANDARD', 'BLENDED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "ARStatus" AS ENUM ('OUTSTANDING', 'PARTIAL', 'PAID', 'WRITTEN_OFF');

-- CreateTable
CREATE TABLE "dim_billing_rate" (
    "id" TEXT NOT NULL,
    "rate_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "rate_type" "BillingRateType" NOT NULL DEFAULT 'STANDARD',
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_billing_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_invoice" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "billed_hours" DOUBLE PRECISION NOT NULL,
    "billing_rate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_ar_entry" (
    "id" TEXT NOT NULL,
    "ar_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3),
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "write_off_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ARStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_ar_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_billing_rate_rate_id_key" ON "dim_billing_rate"("rate_id");

-- CreateIndex
CREATE INDEX "dim_billing_rate_company_id_idx" ON "dim_billing_rate"("company_id");

-- CreateIndex
CREATE INDEX "dim_billing_rate_role_idx" ON "dim_billing_rate"("role");

-- CreateIndex
CREATE UNIQUE INDEX "fact_invoice_invoice_id_key" ON "fact_invoice"("invoice_id");

-- CreateIndex
CREATE INDEX "fact_invoice_company_id_idx" ON "fact_invoice"("company_id");

-- CreateIndex
CREATE INDEX "fact_invoice_audit_id_idx" ON "fact_invoice"("audit_id");

-- CreateIndex
CREATE INDEX "fact_invoice_status_idx" ON "fact_invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fact_ar_entry_ar_id_key" ON "fact_ar_entry"("ar_id");

-- CreateIndex
CREATE INDEX "fact_ar_entry_company_id_idx" ON "fact_ar_entry"("company_id");

-- CreateIndex
CREATE INDEX "fact_ar_entry_invoice_id_idx" ON "fact_ar_entry"("invoice_id");

-- CreateIndex
CREATE INDEX "fact_ar_entry_status_idx" ON "fact_ar_entry"("status");

-- AddForeignKey
ALTER TABLE "dim_billing_rate" ADD CONSTRAINT "dim_billing_rate_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_invoice" ADD CONSTRAINT "fact_invoice_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_invoice" ADD CONSTRAINT "fact_invoice_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "fact_audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_ar_entry" ADD CONSTRAINT "fact_ar_entry_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_ar_entry" ADD CONSTRAINT "fact_ar_entry_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "fact_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
