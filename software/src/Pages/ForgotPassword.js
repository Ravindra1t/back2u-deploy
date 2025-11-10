import React, { useState } from "react";
import { apiBase } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null); setError(null);
    try {
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setMessage(data.resetUrl ? `Reset link: ${data.resetUrl}` : data.message || "If this email exists, a reset link has been generated.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Forgot Password</h1>
        {message && <p className="text-sm text-green-600 mb-3 break-words">{message}</p>}
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Your email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg" disabled={loading}>{loading?"Sending...":"Send Reset Link"}</button>
        </form>
      </div>
    </div>
  );
}
