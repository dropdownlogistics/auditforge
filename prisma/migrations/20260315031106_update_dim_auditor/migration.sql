-- AlterTable
ALTER TABLE "dim_auditor" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "councilSeat" TEXT,
ADD COLUMN     "departure_date" TIMESTAMP(3),
ADD COLUMN     "hire_date" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "specializations" TEXT;
