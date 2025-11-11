import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiBase } from "../config";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Special-case: admin shortcut
      const email = (formData.email || "").trim().toLowerCase();
      const password = (formData.password || "").trim();
      const allowedAdminEmails = [
        "admin1234@amrita.edu",
         // allow common typo too
      ];
      if (allowedAdminEmails.includes(email) && password === "665577") {
        localStorage.setItem("authToken", "admin-local");
        localStorage.setItem("isAdmin", "true");
        setLoading(false);
        navigate("/admin");
        return;
      }

      // Connect to the login endpoint on your backend
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // SUCCESS! Store the token in localStorage
        localStorage.setItem("authToken", data.token);
        
        // Navigate to the main dashboard
        navigate("/dashboard");
      } else {
        // Show error message from backend (e.g., "Invalid credentials")
        setError(data.message || "Login failed. Please check credentials.");
      }
    } catch (err) {
      // Handle network errors
      setLoading(false);
      setError("An error occurred. Please check your connection.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Back2U Logo" className="h-12 mx-auto" onError={(e) => e.target.style.display = 'none'} />
          <h1 className="text-2xl font-bold text-blue-600">Back2U</h1>
          <p className="text-gray-500 text-sm">Amrita Lost & Found</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />

          {/* Error display */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-sm text-center mt-4 text-gray-600">
          <Link to="/forgot-password" className="text-blue-600 font-medium hover:underline mr-3">
            Forgot password?
          </Link>
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}