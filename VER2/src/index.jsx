import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { SettingProvider } from "./contexts/SettingContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <SettingProvider>
      <App />
    </SettingProvider>
  </React.StrictMode>
);