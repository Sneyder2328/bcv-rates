import { registerSW } from "virtual:pwa-register";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { TrpcProvider } from "./trpc/TrpcProvider.tsx";

registerSW({ immediate: true });

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element with id="root" not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <TrpcProvider>
        <App />
      </TrpcProvider>
    </AuthProvider>
  </StrictMode>,
);
