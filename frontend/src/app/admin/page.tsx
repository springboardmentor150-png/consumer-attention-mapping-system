"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/users")
        .then((res) => setUsers(res.data || []))
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "#f0f4ff" }}>User Management & RBAC</h1>
            <p style={{ color: "#4a6080", fontSize: 13 }}>Manage system operators, store managers, and retail analysts</p>
          </div>

          <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 16, padding: 24 }}>
            {loading ? (
              <LoadingSpinner size="md" />
            ) : users.length === 0 ? (
              <div style={{ color: "#8ba3c7", textAlign: "center", padding: 32 }}>No users registered yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {users.map((u) => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(5,15,35,0.6)", borderRadius: 10, border: "1px solid rgba(30,45,74,0.4)" }}>
                    <div>
                      <div style={{ color: "#f0f4ff", fontWeight: 700 }}>{u.full_name || u.email}</div>
                      <div style={{ color: "#4a6080", fontSize: 12 }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
