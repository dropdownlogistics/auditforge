-- Phase D: Add photo_url column to dim_auditor_profile for personal dashboard
ALTER TABLE "dim_auditor_profile" ADD COLUMN "photo_url" TEXT;
