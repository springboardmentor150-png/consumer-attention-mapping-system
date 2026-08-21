"use client";

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types";

interface RegisterFormProps { onSuccess: () => void; }

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "super_admin", label: "Super Admin", desc: "Full platform access" },
  { value: "store_manager", label: "Store Manager", desc: "Store & camera control" },
  { value: "retail_analyst", label: "Retail Analyst", desc: "Analytics & heatmaps" },
  { value: "marketing_manager", label: "Marketing Manager", desc: "Reports & campaigns" },
];

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "", confirmPassword: "", role: "retail_analyst" as UserRole });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName || !form.email || !form.username || !form.password) { setError("All fields are required."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    try {
      await register({ full_name: form.fullName, email: form.email, username: form.username, password: form.password, role: form.role });
      setSuccess(true);
      setTimeout(onSuccess, 1800);
    } catch (err: any) {
      setError(err.message || "Registration failed. Email or username may already exist.");
    }
  };

  const inputStyle = { width: "100%" };

  return (
    <div style={{
      background: "rgba(13, 21, 38, 0.8)", backdropFilter: "blur(24px)",
      border: "1px solid rgba(42, 63, 96, 0.6)", borderRadius: 16,
      padding: "28px 28px 24px", position: "relative", overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)" }} />

      {success ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p style={{ color: "#34d399", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Account Created!</p>
          <p style={{ color: "#4a6080", fontSize: 13 }}>Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, color: "#fb7185", fontSize: 12, fontWeight: 500 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Full Name</label>
            <input type="text" value={form.fullName} onChange={set("fullName")} placeholder="Alex Carter" disabled={isLoading} required className="input-dark" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Username</label>
              <input type="text" value={form.username} onChange={set("username")} placeholder="alexcarter" disabled={isLoading} required className="input-dark" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="alex@cams.io" disabled={isLoading} required className="input-dark" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Password</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" disabled={isLoading} required className="input-dark" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Confirm</label>
              <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" disabled={isLoading} required className="input-dark" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Role</label>
            <select value={form.role} onChange={set("role")} disabled={isLoading} className="input-dark" style={{ cursor: "pointer" }}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
            {isLoading ? <><svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" /><path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg><span>Creating Account...</span></> : <><span>Create Account</span><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg></>}
          </button>
        </form>
      )}
    </div>
  );
}
