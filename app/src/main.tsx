import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "./state/AppContext";
import { ThemeProvider } from "./state/ThemeContext";
import { LoadingProvider } from "./state/LoadingContext";
import { ToastProvider } from "./components/Toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <LoadingProvider>
              <App />
            </LoadingProvider>
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
