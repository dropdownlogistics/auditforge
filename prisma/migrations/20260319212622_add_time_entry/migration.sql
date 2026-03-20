-- CreateTable
CREATE TABLE "Fact_TimeEntry" (
    "id" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "monthTag" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "timeType" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fact_TimeEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fact_TimeEntry" ADD CONSTRAINT "Fact_TimeEntry_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "dim_auditor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact_TimeEntry" ADD CONSTRAINT "Fact_TimeEntry_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "fact_audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
