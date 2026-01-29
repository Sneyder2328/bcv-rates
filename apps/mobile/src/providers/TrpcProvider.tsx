import { createContext, type ReactNode, useContext, useMemo } from "react";
import { getTrpcClient, type TrpcClient } from "../lib/trpcClient";

interface TrpcContextValue {
  client: TrpcClient;
}

const TrpcContext = createContext<TrpcContextValue | null>(null);

export function TrpcProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getTrpcClient(), []);

  return (
    <TrpcContext.Provider value={{ client }}>{children}</TrpcContext.Provider>
  );
}

export function useTrpc() {
  const context = useContext(TrpcContext);
  if (!context) throw new Error("useTrpc must be used within a TrpcProvider");
  return context;
}
