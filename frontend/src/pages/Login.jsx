import "../styles/login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

// Adjust this import path to match where login-bg.jpg actually lives
// in your project (per your screenshot: src/assets/images/login-bg.jpg)
import loginBg from "../assets/images/login-bg.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      // Send admins to the admin console, everyone else to the dashboard
      if (data.role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Left panel — your illustration */}
        <div
          className="login-visual"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="login-visual-text">
            <span className="login-visual-title">Welcome</span>
            <span className="login-visual-subtitle">to Consumer Attention Mapping System</span>
          </div>
        </div>

        {/* Right panel — the form */}
        <div className="login-form-panel">
          <h1 className="login-heading">Login</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-group field-with-link">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <a href="/forgot-password" className="forgot-link">
                Forgot password?
              </a>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="signup-text">
            Don&apos;t have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}