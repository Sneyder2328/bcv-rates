import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "@/trpc/context";

/**
 * Initialization of tRPC backend.
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<TrpcContext>().create();

/**
 * Export reusable router and procedure helpers.
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isServerAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.server?.trusted) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      server: ctx.server,
    },
  });
});

const isAuthedOrServer = t.middleware(({ ctx, next }) => {
  if (!ctx.user && !ctx.server?.trusted) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      server: ctx.server,
    },
  });
});

export const serverProcedure = t.procedure.use(isServerAuthed);
export const protectedOrServerProcedure = t.procedure.use(isAuthedOrServer);
