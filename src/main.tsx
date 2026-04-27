import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppDataProvider } from "./providers/AppDataProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { I18nProvider } from "./lib/i18n";
import { initTheme } from "./lib/theme";
import "./index.css";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
