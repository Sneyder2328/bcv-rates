import { createContext, type ReactNode, useContext } from "react";

// TODO: Replace with actual tRPC client when integrating API
// This is a stub provider for Phase 2 - will be implemented in Phase 3

interface TrpcContextValue {
  // Placeholder for tRPC client
  client: null;
}

const TrpcContext = createContext<TrpcContextValue | null>(null);

interface TrpcProviderProps {
  children: ReactNode;
}

export function TrpcProvider({ children }: TrpcProviderProps) {
  // TODO: Initialize actual tRPC client with React Query
  // See apps/web/src/trpc for reference implementation

  return (
    <TrpcContext.Provider value={{ client: null }}>
      {children}
    </TrpcContext.Provider>
  );
}

export function useTrpc() {
  const context = useContext(TrpcContext);
  if (!context) {
    throw new Error("useTrpc must be used within a TrpcProvider");
  }
  return context;
}
