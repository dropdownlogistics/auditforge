-- Rename Fact_TimeEntry table + constraints to snake_case
-- Applied 2026-04-11 via `prisma db execute` (non-destructive — preserves 1099 existing rows)
-- Model name also changed from Fact_TimeEntry to TimeEntry in schema.prisma

ALTER TABLE "Fact_TimeEntry" RENAME TO "fact_time_entry";
ALTER INDEX "Fact_TimeEntry_pkey" RENAME TO "fact_time_entry_pkey";
ALTER TABLE "fact_time_entry" RENAME CONSTRAINT "Fact_TimeEntry_auditorId_fkey" TO "fact_time_entry_auditorId_fkey";
ALTER TABLE "fact_time_entry" RENAME CONSTRAINT "Fact_TimeEntry_engagementId_fkey" TO "fact_time_entry_engagementId_fkey";
