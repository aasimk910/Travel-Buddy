// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Homepage from "./pages/Homepage";
import Hikes from "./pages/Hikes";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";

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
                <ErrorBoundary>
                  <Homepage />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Profile />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/hikes"
            element={
              <ErrorBoundary>
                <Hikes />
              </ErrorBoundary>
            }
          />
      </Routes>
    </div>
    </ErrorBoundary>
  );
};

export default App;
