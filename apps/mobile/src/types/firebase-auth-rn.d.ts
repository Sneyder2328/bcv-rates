/**
 * Type augmentation for `firebase/auth` in React Native.
 *
 * At runtime Metro resolves `firebase/auth` to the React Native entry point
 * which exports `getReactNativePersistence`. TypeScript's `tsc`, however,
 * resolves to the web `.d.ts` that doesn't include this export.
 *
 * This declaration bridges the gap so `tsc --noEmit` passes while keeping
 * the runtime behavior correct.
 */
import type { Persistence } from "firebase/auth";

declare module "firebase/auth" {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
