-- CreateTable
CREATE TABLE "bridge_audit_auditor" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "auditor_id" TEXT NOT NULL,
    "teamRole" TEXT NOT NULL DEFAULT 'STAFF',
    "budget_hours" DOUBLE PRECISION,
    "assignedPhase" TEXT NOT NULL DEFAULT 'ALL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_audit_auditor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bridge_audit_auditor_audit_id_auditor_id_key" ON "bridge_audit_auditor"("audit_id", "auditor_id");

-- AddForeignKey
ALTER TABLE "bridge_audit_auditor" ADD CONSTRAINT "bridge_audit_auditor_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "fact_audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_audit_auditor" ADD CONSTRAINT "bridge_audit_auditor_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "dim_auditor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
