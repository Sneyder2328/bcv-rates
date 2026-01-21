/**
 * Contract-only tRPC router type for clients (web).
 *
 * IMPORTANT:
 * - This file MUST NOT import Prisma or Nest services.
 * - It exists so frontends can infer types without requiring `prisma generate`
 *   (e.g. on Vercel builds for `apps/web`).
 *
 * The runtime router used by the API is defined elsewhere.
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// ---- exchangeRates.getLatest ----
const latestRateSchema = z
  .object({
    rate: z.string(),
    validAt: z.string(),
    fetchedAt: z.string(),
    previousRate: z.string().nullable().optional(),
  })
  .nullable();

const latestRatesResponseSchema = z.object({
  USD: latestRateSchema,
  EUR: latestRateSchema,
});

// ---- customRates.* ----
const userCustomRateSchema = z.object({
  id: z.string(),
  label: z.string(),
  rate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const labelSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .transform((val) => val.toUpperCase());

const customRatesListOutputSchema = z.object({
  maxPerUser: z.number().int().positive(),
  items: z.array(userCustomRateSchema),
});

export const appRouterType = t.router({
  exchangeRates: t.router({
    getLatest: t.procedure
      .output(latestRatesResponseSchema)
      // This resolver is never executed by the client; it only exists for typing.
      .query(() => {
        throw new Error("Not implemented (type-only router)");
      }),
  }),
  customRates: t.router({
    list: t.procedure.output(customRatesListOutputSchema).query(() => {
      throw new Error("Not implemented (type-only router)");
    }),
    create: t.procedure
      .input(
        z.object({
          label: labelSchema,
          rate: z.string(),
        }),
      )
      .output(userCustomRateSchema)
      .mutation(() => {
        throw new Error("Not implemented (type-only router)");
      }),
    update: t.procedure
      .input(
        z.object({
          id: z.string(),
          label: labelSchema.optional(),
          rate: z.string().optional(),
        }),
      )
      .output(userCustomRateSchema)
      .mutation(() => {
        throw new Error("Not implemented (type-only router)");
      }),
    delete: t.procedure
      .input(z.object({ id: z.string() }))
      .output(z.object({ ok: z.literal(true) }))
      .mutation(() => {
        throw new Error("Not implemented (type-only router)");
      }),
  }),
  historicalRates: t.router({
    getHistory: t.procedure
      .input(
        z.object({
          currency: z.enum(["USD", "EUR"]), // Hardcoded for type-only
          limit: z.number().optional(),
        }),
      )
      .output(z.array(z.object({ date: z.string(), rate: z.string() })))
      .query(() => {
        throw new Error("Not implemented (type-only router)");
      }),
  }),
});

export type AppRouter = typeof appRouterType;
