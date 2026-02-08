-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'USER_IDENTITY_FIELDS_UPDATED_BY_SUPERADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "profileLockedAt" TIMESTAMP(3);
