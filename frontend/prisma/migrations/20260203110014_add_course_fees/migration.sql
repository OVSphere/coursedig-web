-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('VOCATIONAL', 'LEVEL3', 'LEVEL4_5', 'LEVEL7');

-- CreateTable
CREATE TABLE "CourseFee" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "payInFullAvailable" BOOLEAN NOT NULL DEFAULT true,
    "payInFullDiscountPercent" INTEGER NOT NULL DEFAULT 10,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseFee_courseId_key" ON "CourseFee"("courseId");

-- CreateIndex
CREATE INDEX "CourseFee_level_idx" ON "CourseFee"("level");

-- CreateIndex
CREATE INDEX "CourseFee_isActive_idx" ON "CourseFee"("isActive");

-- AddForeignKey
ALTER TABLE "CourseFee" ADD CONSTRAINT "CourseFee_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
