-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('COURSE', 'SCHOLARSHIP');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "applicationType" "ApplicationType" NOT NULL DEFAULT 'COURSE';
