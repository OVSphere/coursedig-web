-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "enquiryRef" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryCounter" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL,

    CONSTRAINT "EnquiryCounter_pkey" PRIMARY KEY ("year","month")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_enquiryRef_key" ON "Enquiry"("enquiryRef");
