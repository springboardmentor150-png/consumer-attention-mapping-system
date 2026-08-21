import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

function Register() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState("");

    const handleRegister = async () => {

        if (!email || !password || !roleId) {
            alert("Please fill all fields.");
            return;
        }

        try {

            await api.post("/register", {
                email: email,
                password: password,
                role_id: Number(roleId)
            });

            alert("Registration Successful!");

            navigate("/");

        } catch (error) {

            console.log(error);
            alert("Registration Failed!");

        }

    };

    return (

        <div className="login-container">

            <div className="login-card">

                <h1>Consumer Attention Mapping System</h1>

                <p>Create your account</p>

                <label>Email</label>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Password</label>

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <label>Role</label>

                <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                >
                    <option value="">Select Role</option>
                    <option value="1">Admin</option>
                    <option value="2">Store Manager</option>
                    <option value="3">Retail Analyst</option>
                    <option value="4">Marketing Manager</option>
                </select>

                <button onClick={handleRegister}>
                    Register
                </button>

                <div className="register-link">
                    Already have an account?{" "}
                    <span
                        className="register-text"
                        onClick={() => navigate("/")}
                    >
                        Login
                    </span>
                </div>

            </div>

        </div>

    );

}

export default Register;