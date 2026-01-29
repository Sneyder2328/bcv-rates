import type { ReactNode } from "react";
import { OnlineStatusProvider } from "../hooks/useOnlineStatus";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { TrpcProvider } from "./TrpcProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <OnlineStatusProvider>
      <QueryProvider>
        <TrpcProvider>
          <AuthProvider>{children}</AuthProvider>
        </TrpcProvider>
      </QueryProvider>
    </OnlineStatusProvider>
  );
}
