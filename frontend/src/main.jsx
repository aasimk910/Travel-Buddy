// src/main.jsx
// Application entry point. Mounts the React app with routing, auth, and toast providers.

// #region Imports
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// #endregion Imports

// Render the app into the root DOM element with all global providers
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
