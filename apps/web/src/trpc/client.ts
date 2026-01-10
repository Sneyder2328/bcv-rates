import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./types.ts";

/**
 * tRPC React hooks.
 * This creates the typed React hooks for calling tRPC procedures.
 */
export const trpc = createTRPCReact<AppRouter>();
