import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context.js";

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
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
