"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/lib/api";
import { PasswordInput } from "@/components/PasswordInput";
import { Sparkles, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("StoreManager");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(email, password);

      if (data.user_id || data.id) {
        localStorage.setItem("email", email);
        localStorage.setItem("role", role);
        router.push("/login");
      } else {
        setError(typeof data === "string" ? data : data.detail || "Registration failed. Try logging in.");
      }
    } catch (err) {
      console.error(err);
      // Fallback
      localStorage.setItem("email", email);
      localStorage.setItem("role", role);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 bg-[#07090e] overflow-hidden">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-purple-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 p-[1.5px] shadow-xl shadow-purple-500/20 mb-3 animate-glow-flow">
            <div className="w-full h-full bg-[#090d16] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
            AURA VISION AI
          </h2>
          <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight font-heading">
            Register Operator Account
          </h1>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl glass-panel-glow border border-white/10 p-8 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Operator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@retailai.io"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Assign System Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["StoreManager", "Analyst", "SuperAdmin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                      role === r
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                minLength={6}
                placeholder="Confirm your password"
              />
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1.5 text-xs text-red-400">
                  Passwords do not match.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Creating Credentials..."
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-white/10">
            Already have an active account?{" "}
            <Link
              href="/login"
              className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
