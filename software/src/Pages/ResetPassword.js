import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiBase } from "../config";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(()=> params.get('token') || '', [params]);
  const email = useMemo(()=> params.get('email') || '', [params]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;
    if (newPassword !== confirmPassword) { setLoading(false); return setError("Passwords do not match"); }
    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      // Force re-login
      localStorage.removeItem("authToken");
      navigate('/login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-1">Reset Password</h1>
        <p className="text-gray-600 text-sm mb-4 break-all">for {email || 'your account'}</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input name="newPassword" type="password" placeholder="New password" className="w-full px-4 py-2 border rounded-lg" required />
          <input name="confirmPassword" type="password" placeholder="Confirm password" className="w-full px-4 py-2 border rounded-lg" required />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg" disabled={loading}>{loading?"Resetting...":"Reset Password"}</button>
        </form>
      </div>
    </div>
  );
}
