import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await axios.post("http://127.0.0.1:8000/auth/register", form);
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Your Account</h1>
        <p className="register-description">
          Sign up to access retail analytics, live dashboard, and customer attention reports.
        </p>

        <form onSubmit={handleRegister} className="register-form">
          <div className="register-field">
            <label htmlFor="name" className="register-label">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="register-input"
            />
          </div>

          <div className="register-field">
            <label htmlFor="email" className="register-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="register-input"
            />
          </div>

          <div className="register-field">
            <label htmlFor="password" className="register-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
              className="register-input"
            />
          </div>

          <div className="register-field">
            <label htmlFor="role" className="register-label">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="register-select"
            >
              <option value="admin">Administrator</option>
              <option value="manager">Store Manager</option>
              <option value="analyst">Retail Analyst</option>
              <option value="marketing">Marketing Manager</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        {error && <p className="register-message register-error">{error}</p>}
        {message && <p className="register-message register-success">{message}</p>}

        <p className="register-footer">
          Already have an account?{' '}
          <Link to="/" className="register-link">Login here</Link>
        </p>
      </div>
    </div>
  );
}
