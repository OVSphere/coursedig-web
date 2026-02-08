-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_PROMOTE_ADMIN', 'USER_DEMOTE_ADMIN', 'USER_PROMOTE_SUPERADMIN', 'USER_DEMOTE_SUPERADMIN', 'ADMIN_SECOND_FACTOR_SET', 'ADMIN_SECOND_FACTOR_CLEARED', 'COURSE_CREATE', 'COURSE_UPDATE', 'COURSE_DELETE', 'COURSE_PUBLISH_TOGGLE', 'COURSE_FEE_UPSERT', 'USER_EMAIL_VERIFIED_BY_USER', 'USER_EMAIL_VERIFIED_BY_ADMIN', 'VERIFICATION_EMAIL_RESENT');

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "shortDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminSecondFactorHash" TEXT,
ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthzAuditEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "AuditAction" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetCourseId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "meta" JSONB,

    CONSTRAINT "AuthzAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationResendAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "EmailVerificationResendAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_isActive_idx" ON "NewsletterSubscriber"("isActive");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "AuthzAuditEvent_actorUserId_idx" ON "AuthzAuditEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "AuthzAuditEvent_targetUserId_idx" ON "AuthzAuditEvent"("targetUserId");

-- CreateIndex
CREATE INDEX "AuthzAuditEvent_targetCourseId_idx" ON "AuthzAuditEvent"("targetCourseId");

-- CreateIndex
CREATE INDEX "AuthzAuditEvent_action_idx" ON "AuthzAuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuthzAuditEvent_createdAt_idx" ON "AuthzAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationResendAttempt_createdAt_idx" ON "EmailVerificationResendAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationResendAttempt_email_createdAt_idx" ON "EmailVerificationResendAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationResendAttempt_ipAddress_createdAt_idx" ON "EmailVerificationResendAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationResendAttempt_userId_createdAt_idx" ON "EmailVerificationResendAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthzAuditEvent" ADD CONSTRAINT "AuthzAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationResendAttempt" ADD CONSTRAINT "EmailVerificationResendAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
