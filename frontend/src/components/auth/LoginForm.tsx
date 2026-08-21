"use client";

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Please fill in all fields."); return; }
    try {
      await login({ email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{
      background: "rgba(13, 21, 38, 0.8)", backdropFilter: "blur(24px)",
      border: "1px solid rgba(42, 63, 96, 0.6)", borderRadius: 16,
      padding: "28px 28px 24px", position: "relative", overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)",
      }} />

      {error && (
        <div style={{
          background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 8, color: "#fb7185", fontSize: 12, fontWeight: 500,
        }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#2a3f60" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="analyst@company.com" disabled={isLoading} required
              className="input-dark" style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8ba3c7", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#2a3f60" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••" disabled={isLoading} required
              className="input-dark" style={{ paddingLeft: 40, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#2a3f60", padding: 2,
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {showPassword
                  ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                  : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                }
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: "100%", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {isLoading ? (
            <>
              <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Access Dashboard</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
