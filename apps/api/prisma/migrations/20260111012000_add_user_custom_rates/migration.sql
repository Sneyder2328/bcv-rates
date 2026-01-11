-- CreateTable
CREATE TABLE "UserCustomRate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCustomRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCustomRate_userId_idx" ON "UserCustomRate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCustomRate_userId_label_key" ON "UserCustomRate"("userId", "label");

