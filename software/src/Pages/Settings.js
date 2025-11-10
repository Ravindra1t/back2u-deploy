import React, { useEffect, useState } from "react";
import { apiBase } from "../config";

export default function Settings() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/users/me`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile({ name: data.name || "", email: data.email || "" });
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateName = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setSavingName(true);
    try {
      const res = await fetch(`${apiBase}/api/users/me/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: profile.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update name");
      setSuccess("Name updated");
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingName(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setSavingPass(true);
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;
    if (newPassword !== confirmPassword) {
      setSavingPass(false);
      return setError("Passwords do not match");
    }
    try {
      const res = await fetch(`${apiBase}/api/users/me/password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      // Force re-login
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    } catch (e) {
      setError(e.message);
      setSavingPass(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-amrita-blue mb-4">Profile</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">{success}</p>}
        <form onSubmit={updateName} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={profile.email} disabled className="w-full px-3 py-2 border rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input value={profile.name} onChange={(e)=>setProfile(p=>({...p, name:e.target.value}))} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <button type="submit" disabled={savingName} className="px-4 py-2 bg-blue-600 text-white rounded-md">{savingName?"Saving...":"Save"}</button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-amrita-blue mb-4">Change Password</h2>
        <form onSubmit={updatePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input name="currentPassword" type="password" className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input name="newPassword" type="password" className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input name="confirmPassword" type="password" className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <button type="submit" disabled={savingPass} className="px-4 py-2 bg-blue-600 text-white rounded-md">{savingPass?"Saving...":"Change Password"}</button>
        </form>
      </div>
    </div>
  );
}
