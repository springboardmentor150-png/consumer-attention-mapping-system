import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "../styles/Auth.css";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const login = async () => {

        if (!email) {
            alert("Email is required");
            return;
        }

        if (!password) {
            alert("Password is required");
            return;
        }

        try {

            const response = await api.post("/auth/login", {
                email,
                password,
            });

            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("role", response.data.role_id);
            localStorage.setItem("username", response.data.username);
            localStorage.setItem("email", response.data.email);

            navigate("/dashboard");

        } catch (error) {

            console.log(error);

            alert("Invalid Email or Password");

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-card">

                <h1 className="title">
                    Consumer Attention System
                </h1>

                <p className="subtitle">
                    Welcome Back!
                </p>

                <div className="form-group">

                    <label>
                        Email
                        <span className="required">*</span>
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                </div>

                <div className="form-group">

                    <label>
                        Password
                        <span className="required">*</span>
                    </label>

                    <div className="password-container">

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            type="button"
                            className="eye-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>

                    </div>

                </div>

                <button
                    className="login-btn"
                    onClick={login}
                >
                    Login
                </button>

                <p className="bottom-text">
                    Don't have an account?
                    <Link
                        to="/register"
                        className="link"
                    >
                        Register Here
                    </Link>
                </p>

            </div>

        </div>

    );

}

export default Login;