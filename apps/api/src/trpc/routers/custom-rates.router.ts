import { TRPCError } from "@trpc/server";
import { z } from "zod";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { protectedProcedure, router } from "@/trpc/trpc";

function parseAmount(raw: string): number | null {
  // Remove spaces and handle both formats:
  // - European/Latin: 1.234,56 (thousands: ., decimal: ,)
  // - US: 1,234.56 (thousands: ,, decimal: .)
  const cleaned = raw.trim().replace(/\s+/g, "");

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized: string;

  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }

  if (!normalized) return null;
  const n = Number(normalized);
  if (Number.isNaN(n)) return null;
  return n;
}

function getMaxCustomRatesPerUser(): number {
  const raw = process.env.CUSTOM_RATES_MAX_PER_USER;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 10;
}

const labelSchema = z
  .string()
  .trim()
  .min(1, "Label is required")
  .max(16, "Label must be 16 characters or fewer")
  .transform((val) => val.toUpperCase())
  .refine((val) => /^[A-Z0-9][A-Z0-9 _.-]*$/.test(val), {
    message: "Label can only contain letters, numbers, spaces, _ . -",
  });

export type UserCustomRateDto = {
  id: string;
  label: string;
  rate: string;
  createdAt: string;
  updatedAt: string;
};

export function createCustomRatesRouter(prisma: PrismaService) {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const maxPerUser = getMaxCustomRatesPerUser();

      const items = await prisma.userCustomRate.findMany({
        where: { userId: ctx.user.uid },
        orderBy: [{ label: "asc" }],
      });

      return {
        maxPerUser,
        items: items.map(
          (r): UserCustomRateDto => ({
            id: r.id,
            label: r.label,
            rate: r.rate.toString(),
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }),
        ),
      };
    }),

    create: protectedProcedure
      .input(
        z.object({
          label: labelSchema,
          rate: z.string().trim().min(1, "Rate is required"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const maxPerUser = getMaxCustomRatesPerUser();
        const existingCount = await prisma.userCustomRate.count({
          where: { userId: ctx.user.uid },
        });

        if (existingCount >= maxPerUser) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You can only save up to ${maxPerUser} custom rates.`,
          });
        }

        const parsedRate = parseAmount(input.rate);
        if (parsedRate === null || parsedRate <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid rate value",
          });
        }

        try {
          const created = await prisma.userCustomRate.create({
            data: {
              userId: ctx.user.uid,
              label: input.label,
              rate: parsedRate.toString(),
            },
          });

          return {
            id: created.id,
            label: created.label,
            rate: created.rate.toString(),
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          } satisfies UserCustomRateDto;
        } catch (err: unknown) {
          // Prisma unique constraint
          if (
            typeof err === "object" &&
            err &&
            "code" in err &&
            err.code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You already have a custom rate with that label.",
            });
          }

          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: protectedProcedure
      .input(
        z
          .object({
            id: z.string().min(1),
            label: labelSchema.optional(),
            rate: z.string().trim().min(1).optional(),
          })
          .refine((v) => v.label !== undefined || v.rate !== undefined, {
            message: "No changes provided",
          }),
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.userCustomRate.findFirst({
          where: { id: input.id, userId: ctx.user.uid },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const data: { label?: string; rate?: string } = {};
        if (input.label !== undefined) data.label = input.label;
        if (input.rate !== undefined) {
          const parsedRate = parseAmount(input.rate);
          if (parsedRate === null || parsedRate <= 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid rate value",
            });
          }
          data.rate = parsedRate.toString();
        }

        try {
          const updated = await prisma.userCustomRate.update({
            where: { id: existing.id },
            data,
          });

          return {
            id: updated.id,
            label: updated.label,
            rate: updated.rate.toString(),
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          } satisfies UserCustomRateDto;
        } catch (err: unknown) {
          if (
            typeof err === "object" &&
            err &&
            "code" in err &&
            err.code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You already have a custom rate with that label.",
            });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const res = await prisma.userCustomRate.deleteMany({
          where: { id: input.id, userId: ctx.user.uid },
        });

        if (res.count === 0) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return { ok: true };
      }),
  });
}

export type CustomRatesRouter = ReturnType<typeof createCustomRatesRouter>;
