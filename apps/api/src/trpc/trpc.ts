import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "@/trpc/context";

/**
 * Initialization of tRPC backend.
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<TrpcContext>().create();

const trackErrors = t.middleware(async ({ ctx, next, path, type }) => {
  const startMs = Date.now();
  const result = await next();

  if (!result.ok) {
    const durationMs = Date.now() - startMs;
    ctx.umami.track(
      "trpc_error",
      {
        path,
        code: result.error.code,
        type,
        authed: Boolean(ctx.user),
        durationMs,
      },
      { url: `https://api/trpc/${path}` },
    );
  }

  return result;
});

/**
 * Export reusable router and procedure helpers.
 */
export const router = t.router;
export const publicProcedure = t.procedure.use(trackErrors);

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

export const protectedProcedure = t.procedure.use(trackErrors).use(isAuthed);
