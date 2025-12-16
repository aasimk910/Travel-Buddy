// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Homepage from "./pages/Homepage";
import Hikes from "./pages/Hikes";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default App;
