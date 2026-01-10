-- CreateTable
CREATE TABLE "HistoricalExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "date" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoricalExchangeRate_currency_date_idx" ON "HistoricalExchangeRate"("currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalExchangeRate_currency_date_key" ON "HistoricalExchangeRate"("currency", "date");
