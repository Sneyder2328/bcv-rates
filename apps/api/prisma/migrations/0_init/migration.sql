-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'EUR');

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "validAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeRate_currency_validAt_idx" ON "ExchangeRate"("currency", "validAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_validAt_key" ON "ExchangeRate"("currency", "validAt");

