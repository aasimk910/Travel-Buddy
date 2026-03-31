// src/App.jsx
// Root application component. Defines all client-side routes and wraps them
// with layout, authentication guards, and an error boundary.

// #region Imports
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import Homepage from "./pages/Homepage";
import Hikes from "./pages/Hikes";
import Dashboard from "./pages/Dashboard";
import Maps from "./pages/Maps";
import BookingConfirmation from "./pages/BookingConfirmation";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Shop from "./pages/Shop";

// #endregion Imports

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Fixed full-screen mountain background video — served from /public */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -2,
            pointerEvents: 'none',
          }}
        >
          <source src="/vid2.mp4" type="video/mp4" />
        </video>
        <Routes>
          {/* --- Public routes (no auth required) --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* --- Protected routes (JWT auth required) --- */}
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Onboarding />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/homepage"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Homepage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hikes"
            element={
              <MainLayout>
                <Hikes />
              </MainLayout>
            }
          />
          <Route
            path="/maps"
            element={
              <MainLayout>
                <Maps />
              </MainLayout>
            }
          />
          <Route
            path="/about"
            element={
              <MainLayout>
                <About />
              </MainLayout>
            }
          />
          <Route
            path="/shop"
            element={
              <MainLayout>
                <Shop />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard/:hikeId?"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/booking-confirmation"
            element={
              <PrivateRoute>
                <MainLayout>
                  <BookingConfirmation />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

// #region Exports
export default App;
// #endregion Exports
