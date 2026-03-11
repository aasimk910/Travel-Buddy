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
import Maps from "./pages/Maps";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Shop from "./pages/Shop";

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

export default App;
