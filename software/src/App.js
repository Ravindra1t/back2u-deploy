import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import Your Pages
import Dashboard from "./Pages/Dashboard";
import ReportFound from "./Pages/ReportFound";
import BrowseFound from "./Pages/BrowseFound";
import ReportLost from "./Pages/ReportLost";
import BrowseLost from "./Pages/BrowseLost";
import AdminDashboard from "./Pages/AdminDashboard";
import MyActivity from "./Pages/MyActivity";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Settings from "./Pages/Settings";
import ResetPassword from "./Pages/ResetPassword";

// Import Your Layout Component
import Layout from "./Layout"; // Assuming Layout.js is in src/

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes without the main layout */}
        {/* Auto-redirect at root based on presence of authToken */}
        <Route
          path="/"
          element={
            localStorage.getItem("authToken")
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* App routes wrapped in the main Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report-found" element={<ReportFound />} />
          <Route path="/browse-found" element={<BrowseFound />} />
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/browse-lost" element={<BrowseLost />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/my-activity" element={<MyActivity />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}