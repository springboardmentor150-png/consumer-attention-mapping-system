import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { User as UserIcon, Mail, Lock, Shield } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Retail Analyst");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:8000/api/auth/register", {
        name,
        email,
        password,
        role
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        "Failed to register. Please check if email already exists."
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    "Admin",
    "Store Manager",
    "Retail Analyst",
    "Marketing Manager"
  ];

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glowing visuals */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accentBlue/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-8 z-10 border border-darkBorder relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accentBlue to-accentCyan flex items-center justify-center font-bold text-darkBg text-xl mx-auto shadow-neon mb-4">
            AM
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-sm text-gray-400 mt-1">Register for the Attention Mapping System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 bg-darkBg/50 border border-darkBorder rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full pl-10 pr-4 py-3 bg-darkBg/50 border border-darkBorder rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-darkBg/50 border border-darkBorder rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Access Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-darkCard border border-darkBorder rounded-xl text-white text-sm focus:outline-none focus:border-accentBlue transition-all duration-200 appearance-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-darkBg">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 px-4 bg-gradient-to-r from-accentBlue to-accentCyan text-darkBg font-bold rounded-xl transition-all duration-300 hover:shadow-neon transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-accentBlue hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
