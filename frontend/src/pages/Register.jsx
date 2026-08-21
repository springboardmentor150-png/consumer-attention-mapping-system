import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "../styles/Auth.css";

function Register() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const register = async () => {

        if (!username) {
            alert("Username is required");
            return;
        }

        if (!email) {
            alert("Email is required");
            return;
        }

        if (!mobileNumber) {
            alert("Mobile Number is required");
            return;
        }

        if (!/^[0-9]{10}$/.test(mobileNumber)) {
            alert("Enter a valid 10-digit Mobile Number");
            return;
        }

        if (!password) {
            alert("Password is required");
            return;
        }

        if (!confirmPassword) {
            alert("Confirm Password is required");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {

            await api.post("/auth/register", {

                username: username,
                email: email,
                mobile_number: mobileNumber,
                password: password,
                role_id: 2

            });

            alert("Registration Successful");

            navigate("/");

        }

        catch (error) {

            console.log(error);

            if (error.response) {

                alert(error.response.data.detail);

            }

            else {

                alert("Registration Failed");

            }

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-card">

                <h1 className="title">

                    Consumer Attention System

                </h1>

                <p className="subtitle">

                    Create New Account

                </p>

                {/* Username */}

                <div className="form-group">

                    <label>

                        Username
                        <span className="required">*</span>

                    </label>

                    <input
                        type="text"
                        placeholder="Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                </div>

                {/* Email */}

                <div className="form-group">

                    <label>

                        Email
                        <span className="required">*</span>

                    </label>

                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                </div>

                {/* Mobile */}

                <div className="form-group">

                    <label>

                        Mobile Number
                        <span className="required">*</span>

                    </label>

                    <input
                        type="text"
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        maxLength={10}
                        onChange={(e) => setMobileNumber(e.target.value)}
                    />

                </div>

                {/* Password */}

                <div className="form-group">

                    <label>

                        Password
                        <span className="required">*</span>

                    </label>

                    <div className="password-container">

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Password"
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

                {/* Confirm Password */}

                <div className="form-group">

                    <label>

                        Confirm Password
                        <span className="required">*</span>

                    </label>

                    <div className="password-container">

                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                        />

                        <button
                            type="button"
                            className="eye-btn"
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                        >

                            {
                                showConfirmPassword
                                    ? <FaEyeSlash />
                                    : <FaEye />
                            }

                        </button>

                    </div>

                </div>

                <button
                    className="login-btn"
                    onClick={register}
                >

                    Register

                </button>

                <p className="bottom-text">

                    Already have an account?

                    <Link
                        to="/"
                        className="link"
                    >

                        Login Here

                    </Link>

                </p>

            </div>

        </div>

    );

}

export default Register;