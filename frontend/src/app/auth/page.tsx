"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { LoginForm } from "../../components/auth/LoginForm";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { ROUTES } from "../../utils/constants";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) router.replace(ROUTES.DASHBOARD);
  }, [isAuthenticated, router]);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.10) 0%, transparent 60%), #020817",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated grid background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Floating orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "8%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(40px)", animation: "float-up 6s ease-in-out infinite alternate",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "5%",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", animation: "float-up 8s ease-in-out infinite alternate-reverse",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "60%", left: "40%",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 420, zIndex: 10, animation: "fade-in 0.6s ease forwards" }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 20,
            background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.3), 0 20px 40px rgba(59,130,246,0.3)",
            marginBottom: 16, position: "relative",
          }}>
            {/* Eye icon */}
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {/* Orbiting dot */}
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 16, height: 16, borderRadius: "50%",
              background: "#10b981", border: "2px solid #020817",
              boxShadow: "0 0 10px #10b981",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #f0f4ff 0%, #93c5fd 60%, #818cf8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 8,
          }}>
            CAMS Intelligence
          </h1>
          <p style={{ color: "#4a6080", fontSize: 13, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Consumer Attention Mapping System
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "rgba(5,15,35,0.6)",
          borderRadius: 12, padding: 4, marginBottom: 20,
          border: "1px solid rgba(42,63,96,0.5)",
        }}>
          {["Login", "Register"].map((tab) => {
            const active = (tab === "Login") === isLogin;
            return (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === "Login")}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: active ? "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)" : "transparent",
                  color: active ? "#93c5fd" : "#4a6080",
                  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  cursor: "pointer",
                  boxShadow: active ? "0 0 20px rgba(59,130,246,0.15)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Form */}
        {isLogin
          ? <LoginForm onSuccess={() => router.replace(ROUTES.DASHBOARD)} />
          : <RegisterForm onSuccess={() => setIsLogin(true)} />
        }

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#1e2d4a", marginTop: 24 }}>
          Protected by end-to-end JWT encryption • CAMS v1.0
        </p>
      </div>
    </main>
  );
}
