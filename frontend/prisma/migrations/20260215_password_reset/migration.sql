-- CreateTable
CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_usedAt_idx" ON "PasswordResetToken"("usedAt");

-- AddForeignKey
ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "PasswordResetRequestAttempt" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT,

  CONSTRAINT "PasswordResetRequestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequestAttempt_createdAt_idx" ON "PasswordResetRequestAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetRequestAttempt_email_createdAt_idx" ON "PasswordResetRequestAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetRequestAttempt_ipAddress_createdAt_idx" ON "PasswordResetRequestAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetRequestAttempt_userId_createdAt_idx" ON "PasswordResetRequestAttempt"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordResetRequestAttempt"
ADD CONSTRAINT "PasswordResetRequestAttempt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
