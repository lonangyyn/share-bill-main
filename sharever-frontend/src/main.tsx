import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./app/providers/app-provider";

import AppRouter from "./app/router/router";

import "./index.css";   // chỉ import file này

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>
);
