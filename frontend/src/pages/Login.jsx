import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import { getDashboardPathForRole } from '../utils/roleUtils';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await loginUser({ email, password });
      const token = data.access_token || data.token || data.accessToken;
      const returnedUser = data.user || { email, role: 'admin', name: email.split('@')[0] };

      if (!token) {
        throw new Error('No authentication token returned from server.');
      }

      window.localStorage.setItem('authToken', token);
      window.localStorage.setItem('authUser', JSON.stringify(returnedUser));
      setUser(returnedUser);

      setSuccessMessage('Login successful! Redirecting to dashboard...');
      
      // Role-based routing
      const dashboardPath = getDashboardPathForRole(returnedUser.role);
      window.setTimeout(() => navigate(dashboardPath), 700);
    } catch (submitError) {
      // Friendly network / server error messages
      if (submitError.message === 'Network Error' || !submitError.response) {
        setError('Unable to reach the server. Is the backend running at http://127.0.0.1:8000 ?');
      } else {
        setError(submitError.response?.data?.detail || submitError.message || 'Login Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brandArea">
          <div className="login-brandIcon">👁️</div>
          <div>
            <h1 className="login-title">Consumer Attention</h1>
            <p className="login-subtitle">AI Powered Retail Analytics</p>
          </div>
        </div>

        <div className="login-formWrapper">
          <div className="login-header">
            <h2 className="login-heading">Login</h2>
            <p className="login-description">Welcome back! Please login to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-errorMessage">{error}</div>}
            {successMessage && <div className="login-successMessage">{successMessage}</div>}

            <div className="login-fieldGroup">
              <label className="login-label" htmlFor="email">Email</label>
              <div className="login-inputWrapper">
                <span className="login-inputIcon">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-fieldGroup">
              <label className="login-label" htmlFor="password">Password</label>
              <div className="login-inputWrapper">
                <span className="login-inputIcon">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="login-input"
                  autoComplete="current-password"
                />
                <span className="login-eyeIcon">👁️</span>
              </div>
            </div>

            <div className="login-rowBetween">
              <label className="login-checkboxLabel">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                Remember me
              </label>
              <Link to="#" className="login-forgotLink">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-primaryButton" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="login-divider">
            <span className="login-dividerLine" />
            <span className="login-dividerText">or</span>
            <span className="login-dividerLine" />
          </div>

          <button type="button" className="login-secondaryButton">
            <span className="login-googleIcon">G</span> Login with Google
          </button>

          <p className="login-footerText">
            Don’t have an account?{' '}
            <Link to="/register" className="login-registerLink">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
