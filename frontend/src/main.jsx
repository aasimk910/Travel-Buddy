// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

createRoot(document.getElementById("root")).render(
  // StrictMode disabled to prevent double API calls during development
  // <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
            <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  // </StrictMode>
);
