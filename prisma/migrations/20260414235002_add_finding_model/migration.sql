-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('MATERIAL_WEAKNESS', 'SIGNIFICANT_DEFICIENCY', 'CONTROL_DEFICIENCY', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'IN_REMEDIATION', 'CLOSED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "fact_finding" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "control_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "owner" TEXT NOT NULL,
    "target_date" TIMESTAMP(3),
    "closed_date" TIMESTAMP(3),
    "management_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fact_finding_finding_id_key" ON "fact_finding"("finding_id");

-- CreateIndex
CREATE INDEX "fact_finding_audit_id_idx" ON "fact_finding"("audit_id");

-- CreateIndex
CREATE INDEX "fact_finding_severity_idx" ON "fact_finding"("severity");

-- CreateIndex
CREATE INDEX "fact_finding_status_idx" ON "fact_finding"("status");

-- AddForeignKey
ALTER TABLE "fact_finding" ADD CONSTRAINT "fact_finding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_finding" ADD CONSTRAINT "fact_finding_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "fact_audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_finding" ADD CONSTRAINT "fact_finding_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE SET NULL ON UPDATE CASCADE;
