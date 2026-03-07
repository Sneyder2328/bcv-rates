#!/usr/bin/env node

import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SOURCE_PATH = path.resolve(
  __dirname,
  "../data/bcv_usd_ves_historico.csv",
);
const BATCH_SIZE = 200;
const CURRENCIES = new Set(["USD", "EUR"]);

async function main() {
  const { filePath, replace } = parseArgs(process.argv.slice(2));
  const resolvedFilePath = path.resolve(process.cwd(), filePath);

  const [{ PrismaClient, Prisma, CurrencyCode }, csvText] = await Promise.all([
    import("../dist/generated/prisma/client.js"),
    fs.readFile(resolvedFilePath, "utf8"),
  ]);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const adapter = new PrismaPg({
    connectionString,
    maxConnections: Number(process.env.DATABASE_POOL_SIZE || 10),
    minConnections: Number(process.env.DATABASE_MIN_CONNECTIONS || 0),
    connectionTimeout: Number(
      process.env.DATABASE_CONNECTION_TIMEOUT_MS || 5000,
    ),
    idleTimeout: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
  });

  const prisma = new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

  try {
    await prisma.$connect();

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      console.log(`No importable rows found in ${resolvedFilePath}`);
      return;
    }

    const records = rows.map((row) => normalizeRow(row, Prisma, CurrencyCode));
    const latestByCurrency = selectLatestRecords(records);

    if (replace) {
      await prisma.$transaction([
        prisma.historicalExchangeRate.deleteMany({
          where: {
            currency: { in: Array.from(CURRENCIES) },
          },
        }),
        prisma.exchangeRate.deleteMany({
          where: {
            currency: { in: Array.from(CURRENCIES) },
          },
        }),
      ]);
    }

    let historicalWrites = 0;
    let exchangeWrites = 0;

    for (const chunk of chunked(records, BATCH_SIZE)) {
      const operations = [];

      for (const record of chunk) {
        operations.push(
          prisma.historicalExchangeRate.upsert({
            where: {
              currency_date: {
                currency: record.currency,
                date: record.date,
              },
            },
            create: {
              currency: record.currency,
              date: record.date,
              rate: record.rate,
              fetchedAt: record.fetchedAt,
            },
            update: {
              rate: record.rate,
              fetchedAt: record.fetchedAt,
            },
          }),
        );
      }

      const results = await prisma.$transaction(operations);
      historicalWrites += results.length;
    }

    for (const record of latestByCurrency.values()) {
      await prisma.exchangeRate.upsert({
        where: {
          currency_validAt: {
            currency: record.currency,
            validAt: record.date,
          },
        },
        create: {
          currency: record.currency,
          validAt: record.date,
          rate: record.rate,
          fetchedAt: record.fetchedAt,
        },
        update: {
          rate: record.rate,
          fetchedAt: record.fetchedAt,
        },
      });
      exchangeWrites += 1;
    }

    const [historicalCount, exchangeCount] = await Promise.all([
      prisma.historicalExchangeRate.count({
        where: {
          currency: { in: Array.from(CURRENCIES) },
        },
      }),
      prisma.exchangeRate.count({
        where: {
          currency: { in: Array.from(CURRENCIES) },
        },
      }),
    ]);

    console.log("Historical rates import completed.");
    console.log(`Source file: ${resolvedFilePath}`);
    console.log(`Rows parsed: ${rows.length}`);
    console.log(`Historical upserts: ${historicalWrites}`);
    console.log(`Latest exchange upserts: ${exchangeWrites}`);
    console.log(`HistoricalExchangeRate total (USD+EUR): ${historicalCount}`);
    console.log(`ExchangeRate total (USD+EUR): ${exchangeCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

function parseArgs(args) {
  let filePath = DEFAULT_SOURCE_PATH;
  let replace = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--file") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--file requires a value.");
      }
      filePath = value;
      index += 1;
      continue;
    }

    if (arg === "--replace") {
      replace = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { filePath, replace };
}

function printHelp() {
  console.log(`Import historical BCV rates into Prisma/PostgreSQL.

Usage:
  pnpm run import:historical
  pnpm run import:historical -- --file /absolute/path/to/bcv.csv
  pnpm run import:historical -- --replace

Options:
  --file     Override the CSV source path.
  --replace  Delete existing USD/EUR historical and latest rows before import.
  --help     Show this help message.
`);
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function normalizeRow(row, Prisma, CurrencyCode) {
  const currency = row.moneda?.trim().toUpperCase();
  if (!CURRENCIES.has(currency)) {
    throw new Error(`Unsupported currency "${row.moneda}" in source file.`);
  }

  const rawRate = row.bs_por_moneda_venta?.trim();
  if (!rawRate) {
    throw new Error(
      `Missing bs_por_moneda_venta for ${currency} on ${row.fecha_valor}.`,
    );
  }

  const date = parseDateOnly(row.fecha_valor);
  const fetchedAt = parseFetchedAt(row.publicado_en, row.fecha_operacion);

  return {
    currency: CurrencyCode[currency],
    date,
    fetchedAt,
    rate: new Prisma.Decimal(rawRate),
  };
}

function parseDateOnly(value) {
  if (!value) {
    throw new Error("Missing fecha_valor.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid fecha_valor: ${value}`);
  }

  return date;
}

function parseFetchedAt(publishedAt, operationDate) {
  const source = publishedAt?.trim()
    ? `${publishedAt.trim().replace(" ", "T")}-04:00`
    : `${operationDate}T12:00:00-04:00`;

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid publicado_en/fecha_operacion value: ${source}`);
  }

  return date;
}

function selectLatestRecords(records) {
  const latestByCurrency = new Map();

  for (const record of records) {
    const current = latestByCurrency.get(record.currency);
    if (!current || record.date > current.date) {
      latestByCurrency.set(record.currency, record);
    }
  }

  return latestByCurrency;
}

function* chunked(items, size) {
  for (let index = 0; index < items.length; index += size) {
    yield items.slice(index, index + size);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
