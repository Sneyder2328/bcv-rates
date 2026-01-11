import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { TrpcProvider } from "./trpc/TrpcProvider.tsx";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element with id="root" not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <TrpcProvider>
      <App />
    </TrpcProvider>
  </StrictMode>,
);
